<?php
/**
 * SendWhatsAppService
 * Service centralizado para envio de mensagens via WhatsApp
 * Suporta: Evolution API, Twilio, Meta/Facebook
 */

// Não incluir config.php aqui para evitar dependência circular
// As funções necessárias (get_whatsapp_settings) devem estar disponíveis quando o service for chamado

class SendWhatsAppService {
    
    /**
     * Enviar mensagem via WhatsApp
     * 
     * @param PDO $pdo Conexão com o banco
     * @param string $family_id ID da família
     * @param string $phoneNumber Número de telefone (com ou sem DDI)
     * @param string $message Mensagem a ser enviada
     * @param array $options Opções adicionais (provider, api_url, etc.)
     * @return array ['success' => bool, 'message_id' => string|null, 'provider' => string, 'error' => string|null]
     */
    public static function sendMessage($pdo, $family_id, $phoneNumber, $message, $options = []) {
        try {
            // Buscar configuração se não fornecida nas opções
            if (empty($options['config'])) {
                $config = get_whatsapp_settings($pdo, $family_id);
            } else {
                $config = $options['config'];
            }
            
            // Verificar se está configurado e ativo
            if (empty($config) || !$config['is_active']) {
                error_log("SendWhatsAppService: WhatsApp não configurado ou desativado para família $family_id");
                return [
                    'success' => false,
                    'error' => 'WhatsApp não configurado ou desativado',
                    'provider' => null
                ];
            }
            
            // Formatar número de telefone
            $formattedNumber = self::formatPhoneNumber($phoneNumber);
            
            error_log("SendWhatsAppService: Enviando mensagem para $formattedNumber via {$config['provider']} (Família: $family_id)");
            
            // Escolher método baseado no provedor
            $provider = $config['provider'];
            $result = match ($provider) {
                'evolution' => self::sendViaEvolution($config, $formattedNumber, $message),
                'twilio' => self::sendViaTwilio($config, $formattedNumber, $message),
                'meta' => self::sendViaMeta($config, $formattedNumber, $message),
                default => [
                    'success' => false,
                    'error' => 'Provedor desconhecido: ' . $provider,
                    'provider' => $provider
                ]
            };
            
            // Log do resultado
            if ($result['success']) {
                error_log("SendWhatsAppService: Mensagem enviada com sucesso. Provider: {$result['provider']}, Message ID: " . ($result['message_id'] ?? 'N/A'));
            } else {
                error_log("SendWhatsAppService: Erro ao enviar mensagem. Provider: {$result['provider']}, Error: " . ($result['error'] ?? 'Desconhecido'));
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log("SendWhatsAppService: Exceção ao enviar mensagem: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Erro ao enviar mensagem: ' . $e->getMessage(),
                'provider' => null
            ];
        }
    }
    
    /**
     * Formatar número de telefone
     * Adiciona DDI brasileiro (55) se necessário
     * 
     * @param string $phoneNumber Número de telefone
     * @return string Número formatado (apenas dígitos com DDI)
     */
    private static function formatPhoneNumber($phoneNumber) {
        // Limpar (apenas dígitos)
        $phoneNumber = preg_replace('/\D/', '', $phoneNumber);
        
        // Garantir DDI brasileiro (55)
        // Se tem 10 ou 11 dígitos → adicionar 55
        if (strlen($phoneNumber) === 10 || strlen($phoneNumber) === 11) {
            $phoneNumber = '55' . $phoneNumber;
        }
        
        // Se já começa com 55 e tem mais de 12 dígitos, manter
        // Se não começa com 55 e tem mais de 11 dígitos, assumir que já tem DDI
        
        return $phoneNumber;
    }
    
    /**
     * Enviar via Evolution API
     * 
     * @param array $config Configurações do WhatsApp
     * @param string $phoneNumber Número formatado
     * @param string $message Mensagem
     * @return array
     */
    private static function sendViaEvolution($config, $phoneNumber, $message) {
        $api_url = $config['api_url'];
        $api_key = $config['api_key'];
        $instance_name = $config['instance_name'];
        
        $url = rtrim($api_url, '/') . '/message/sendText/' . $instance_name;
        $payload = [
            'number' => $phoneNumber,
            'text' => $message,
        ];
        
        $headers = [
            'Content-Type: application/json',
            'apikey: ' . $api_key,
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        // Tratamento de SSL (para desenvolvimento)
        if (defined('WHATSAPP_IGNORE_SSL') && WHATSAPP_IGNORE_SSL && strpos($api_url, 'https://') === 0) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        // Log detalhado
        error_log("SendWhatsAppService [Evolution]: URL: $url");
        error_log("SendWhatsAppService [Evolution]: Payload: " . json_encode($payload));
        error_log("SendWhatsAppService [Evolution]: HTTP Code: $httpCode");
        error_log("SendWhatsAppService [Evolution]: Response: " . substr($response, 0, 500));
        
        if ($curlError) {
            return [
                'success' => false,
                'error' => 'Erro de conexão: ' . $curlError,
                'provider' => 'evolution',
                'message_id' => null
            ];
        }
        
        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);
            $messageId = null;
            
            if (isset($result['key']['id'])) {
                $messageId = $result['key']['id'];
            } elseif (isset($result['key'])) {
                $messageId = is_string($result['key']) ? $result['key'] : json_encode($result['key']);
            } elseif (isset($result['message'])) {
                $messageId = $result['message'];
            }
            
            return [
                'success' => true,
                'message_id' => $messageId,
                'provider' => 'evolution'
            ];
        } else {
            // Tratamento de erros específicos da Evolution API
            $errorData = json_decode($response, true);
            $errorMessage = "Erro HTTP $httpCode";
            
            if (isset($errorData['response']['message']) && is_array($errorData['response']['message'])) {
                $errorMsg = implode(', ', $errorData['response']['message']);
                if (stripos($errorMsg, 'does not exist') !== false || stripos($errorMsg, 'não existe') !== false) {
                    $errorMessage = "A instância \"$instance_name\" não existe na Evolution API. Você precisa criar a instância primeiro. Acesse o painel da Evolution API em $api_url e crie uma instância com o nome \"$instance_name\". Depois, escaneie o QR Code com seu WhatsApp para conectar.";
                } else {
                    $errorMessage = "Erro da Evolution API: " . $errorMsg;
                }
            } elseif (isset($errorData['error'])) {
                $errorMessage = "Erro da Evolution API: " . $errorData['error'];
            } else {
                $errorMessage = "Erro HTTP $httpCode: " . substr($response, 0, 200);
            }
            
            return [
                'success' => false,
                'error' => $errorMessage,
                'provider' => 'evolution',
                'message_id' => null
            ];
        }
    }
    
    /**
     * Enviar via Twilio API
     * 
     * @param array $config Configurações do WhatsApp
     * @param string $phoneNumber Número formatado
     * @param string $message Mensagem
     * @return array
     */
    private static function sendViaTwilio($config, $phoneNumber, $message) {
        $api_key = $config['api_key']; // Account SID
        $api_token = $config['api_token']; // Auth Token
        $whatsapp_number = $config['whatsapp_number']; // Número do Twilio
        
        $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $api_key . '/Messages.json';
        $payload = [
            'From' => 'whatsapp:+' . $whatsapp_number,
            'To' => 'whatsapp:+' . $phoneNumber,
            'Body' => $message,
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        curl_setopt($ch, CURLOPT_USERPWD, $api_key . ':' . $api_token);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        // Log detalhado
        error_log("SendWhatsAppService [Twilio]: URL: $url");
        error_log("SendWhatsAppService [Twilio]: HTTP Code: $httpCode");
        error_log("SendWhatsAppService [Twilio]: Response: " . substr($response, 0, 500));
        
        if ($curlError) {
            return [
                'success' => false,
                'error' => 'Erro de conexão: ' . $curlError,
                'provider' => 'twilio',
                'message_id' => null
            ];
        }
        
        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);
            $messageId = $result['sid'] ?? null;
            
            return [
                'success' => true,
                'message_id' => $messageId,
                'provider' => 'twilio'
            ];
        } else {
            $errorData = json_decode($response, true);
            $errorMessage = "Erro HTTP $httpCode";
            
            if (isset($errorData['message'])) {
                $errorMessage = "Erro da Twilio: " . $errorData['message'];
            } else {
                $errorMessage = "Erro HTTP $httpCode: " . substr($response, 0, 200);
            }
            
            return [
                'success' => false,
                'error' => $errorMessage,
                'provider' => 'twilio',
                'message_id' => null
            ];
        }
    }
    
    /**
     * Enviar via Meta/Facebook API
     * 
     * @param array $config Configurações do WhatsApp
     * @param string $phoneNumber Número formatado
     * @param string $message Mensagem
     * @return array
     */
    private static function sendViaMeta($config, $phoneNumber, $message) {
        $api_url = $config['api_url'];
        $api_token = $config['api_token'];
        
        $url = rtrim($api_url, '/') . '/messages';
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $phoneNumber,
            'type' => 'text',
            'text' => [
                'body' => $message
            ],
        ];
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_token,
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        // Log detalhado
        error_log("SendWhatsAppService [Meta]: URL: $url");
        error_log("SendWhatsAppService [Meta]: HTTP Code: $httpCode");
        error_log("SendWhatsAppService [Meta]: Response: " . substr($response, 0, 500));
        
        if ($curlError) {
            return [
                'success' => false,
                'error' => 'Erro de conexão: ' . $curlError,
                'provider' => 'meta',
                'message_id' => null
            ];
        }
        
        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);
            $messageId = null;
            
            if (isset($result['messages'][0]['id'])) {
                $messageId = $result['messages'][0]['id'];
            }
            
            return [
                'success' => true,
                'message_id' => $messageId,
                'provider' => 'meta'
            ];
        } else {
            $errorData = json_decode($response, true);
            $errorMessage = "Erro HTTP $httpCode";
            
            if (isset($errorData['error']['message'])) {
                $errorMessage = "Erro da Meta API: " . $errorData['error']['message'];
            } elseif (isset($errorData['error'])) {
                $errorMessage = "Erro da Meta API: " . json_encode($errorData['error']);
            } else {
                $errorMessage = "Erro HTTP $httpCode: " . substr($response, 0, 200);
            }
            
            return [
                'success' => false,
                'error' => $errorMessage,
                'provider' => 'meta',
                'message_id' => null
            ];
        }
    }
}

