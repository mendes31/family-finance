<?php
/**
 * API de Configurações de WhatsApp
 * Endpoints: GET/POST /api/whatsapp_settings.php?action=get|save|test
 */

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$user_id = get_current_user_id();
if (!$user_id) {
    json_error('Usuário não autenticado', 401);
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get':
        handleGetWhatsAppSettings();
        break;
    case 'save':
        handleSaveWhatsAppSettings();
        break;
    case 'test':
        handleTestWhatsAppSettings();
        break;
    default:
        json_error('Ação inválida', 400);
}

function handleGetWhatsAppSettings() {
    global $pdo, $user_id;
    
    try {
        // Buscar família do usuário
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        
        if (!$membership || empty($membership['family_id'])) {
            json_response(['settings' => null]);
        }
        
        $family_id = $membership['family_id'];
        
        // Buscar configurações de WhatsApp
        $stmt = $pdo->prepare("
            SELECT 
                id, provider, api_url, api_key, api_token, instance_name,
                whatsapp_number, webhook_url, is_active, created_at, updated_at
            FROM whatsapp_settings
            WHERE family_id = ?
            LIMIT 1
        ");
        $stmt->execute([$family_id]);
        $settings = $stmt->fetch();
        
        // Não retornar API Key e Token por segurança (apenas se já existir)
        if ($settings) {
            $settings['api_key'] = $settings['api_key'] ? '***' : '';
            $settings['api_token'] = $settings['api_token'] ? '***' : '';
        }
        
        json_response(['settings' => $settings ?: null]);
        
    } catch (PDOException $e) {
        error_log("Erro ao buscar configurações de WhatsApp: " . $e->getMessage());
        json_error('Erro ao buscar configurações: ' . $e->getMessage(), 500);
    }
}

function handleSaveWhatsAppSettings() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $provider = trim($data['provider'] ?? '');
    $api_url = trim($data['api_url'] ?? '');
    $api_key = trim($data['api_key'] ?? '');
    $api_token = trim($data['api_token'] ?? '');
    $instance_name = trim($data['instance_name'] ?? '');
    $whatsapp_number = trim($data['whatsapp_number'] ?? '');
    $webhook_url = trim($data['webhook_url'] ?? '');
    $is_active = isset($data['is_active']) ? (bool)$data['is_active'] : true;
    
    // Validações
    if (empty($provider) || !in_array($provider, ['evolution', 'twilio', 'meta'])) {
        json_error('Provedor inválido', 400);
    }
    
    if (empty($api_key)) {
        json_error('API Key é obrigatória', 400);
    }
    
    if (empty($instance_name)) {
        json_error('Nome da instância é obrigatório', 400);
    }
    
    if (empty($whatsapp_number)) {
        json_error('Número WhatsApp é obrigatório', 400);
    }
    
    // Validar número (deve conter apenas dígitos)
    $whatsapp_number = preg_replace('/[^0-9]/', '', $whatsapp_number);
    if (strlen($whatsapp_number) < 10) {
        json_error('Número WhatsApp inválido', 400);
    }
    
    // Validar URL se fornecida
    if (!empty($api_url) && !filter_var($api_url, FILTER_VALIDATE_URL)) {
        json_error('URL da API inválida', 400);
    }
    
    if (!empty($webhook_url) && !filter_var($webhook_url, FILTER_VALIDATE_URL)) {
        json_error('URL do webhook inválida', 400);
    }
    
    try {
        // Buscar família do usuário
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        
        if (!$membership || empty($membership['family_id'])) {
            json_error('Família não encontrada', 404);
        }
        
        $family_id = $membership['family_id'];
        
        // Verificar se já existe configuração
        $stmt = $pdo->prepare("SELECT id FROM whatsapp_settings WHERE family_id = ? LIMIT 1");
        $stmt->execute([$family_id]);
        $existing = $stmt->fetch();
        
        // Criptografar senhas (usar mesma lógica do email_settings)
        global $encryption_key, $encryption_method;
        
        // Se a API Key vier como '***', significa que não foi alterada
        $api_key_to_save = ($api_key === '***') ? null : $api_key;
        $api_token_to_save = ($api_token === '***') ? null : $api_token;
        
        // Se não for '***', criptografar
        if ($api_key_to_save && $api_key_to_save !== '***') {
            $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($encryption_method));
            $encrypted = openssl_encrypt($api_key_to_save, $encryption_method, $encryption_key, 0, $iv);
            $api_key_encrypted = base64_encode($iv . $encrypted);
        } else {
            // Buscar a existente
            if ($existing) {
                $stmt = $pdo->prepare("SELECT api_key FROM whatsapp_settings WHERE id = ?");
                $stmt->execute([$existing['id']]);
                $old = $stmt->fetch();
                $api_key_encrypted = $old['api_key'] ?? null;
            } else {
                $api_key_encrypted = null;
            }
        }
        
        if ($api_token_to_save && $api_token_to_save !== '***') {
            $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($encryption_method));
            $encrypted = openssl_encrypt($api_token_to_save, $encryption_method, $encryption_key, 0, $iv);
            $api_token_encrypted = base64_encode($iv . $encrypted);
        } else {
            // Buscar a existente
            if ($existing) {
                $stmt = $pdo->prepare("SELECT api_token FROM whatsapp_settings WHERE id = ?");
                $stmt->execute([$existing['id']]);
                $old = $stmt->fetch();
                $api_token_encrypted = $old['api_token'] ?? null;
            } else {
                $api_token_encrypted = null;
            }
        }
        
        if ($existing) {
            // Atualizar
            $settings_id = $existing['id'];
            $stmt = $pdo->prepare("
                UPDATE whatsapp_settings SET
                    provider = ?,
                    api_url = ?,
                    api_key = COALESCE(?, api_key),
                    api_token = ?,
                    instance_name = ?,
                    whatsapp_number = ?,
                    webhook_url = ?,
                    is_active = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $provider,
                $api_url ?: null,
                $api_key_encrypted,
                $api_token_encrypted,
                $instance_name,
                $whatsapp_number,
                $webhook_url ?: null,
                $is_active ? 1 : 0,
                $settings_id,
            ]);
        } else {
            // Criar novo
            $settings_id = generate_uuid();
            $stmt = $pdo->prepare("
                INSERT INTO whatsapp_settings (
                    id, family_id, provider, api_url, api_key, api_token,
                    instance_name, whatsapp_number, webhook_url, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $settings_id,
                $family_id,
                $provider,
                $api_url ?: null,
                $api_key_encrypted,
                $api_token_encrypted,
                $instance_name,
                $whatsapp_number,
                $webhook_url ?: null,
                $is_active ? 1 : 0,
            ]);
        }
        
        json_response([
            'message' => 'Configurações salvas com sucesso',
            'settings_id' => $settings_id,
        ]);
        
    } catch (PDOException $e) {
        error_log("Erro ao salvar configurações de WhatsApp: " . $e->getMessage());
        json_error('Erro ao salvar configurações: ' . $e->getMessage(), 500);
    }
}

function handleTestWhatsAppSettings() {
    global $pdo, $user_id;
    
    require_once __DIR__ . '/helpers/SendWhatsAppService.php';
    
    $data = get_request_body();
    $provider = trim($data['provider'] ?? '');
    $api_url = trim($data['api_url'] ?? '');
    $api_key = trim($data['api_key'] ?? '');
    $api_token = trim($data['api_token'] ?? '');
    $instance_name = trim($data['instance_name'] ?? '');
    $whatsapp_number = trim($data['whatsapp_number'] ?? '');
    $test_number = trim($data['test_number'] ?? '');
    
    // Validações
    if (empty($test_number)) {
        json_error('Número de teste é obrigatório', 400);
    }
    
    try {
        // Buscar família do usuário
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        
        if (!$membership || empty($membership['family_id'])) {
            json_error('Usuário não pertence a uma família', 400);
        }
        
        $family_id = $membership['family_id'];
        
        // Se api_key ou api_token vierem como '***' ou vazios, buscar do banco
        // Isso acontece quando o usuário testa sem alterar os campos mascarados
        if ($api_key === '***' || empty($api_key) || $api_token === '***' || (empty($api_token) && $provider !== 'evolution')) {
            $stmt = $pdo->prepare("SELECT api_key, api_token, api_url, instance_name, whatsapp_number FROM whatsapp_settings WHERE family_id = ? LIMIT 1");
            $stmt->execute([$family_id]);
            $saved = $stmt->fetch();
            
            if ($saved) {
                global $encryption_key, $encryption_method;
                $iv_length = openssl_cipher_iv_length($encryption_method);
                
                // Descriptografar API Key se necessário
                if ($api_key === '***' || empty($api_key)) {
                    if ($saved['api_key']) {
                        $encrypted_data = base64_decode($saved['api_key']);
                        if (strlen($encrypted_data) > $iv_length) {
                            $iv = substr($encrypted_data, 0, $iv_length);
                            $encrypted = substr($encrypted_data, $iv_length);
                            $decrypted_key = openssl_decrypt($encrypted, $encryption_method, $encryption_key, 0, $iv);
                            if ($decrypted_key !== false) {
                                $api_key = $decrypted_key;
                            }
                        }
                    }
                }
                
                // Descriptografar API Token se necessário
                if (($api_token === '***' || empty($api_token)) && $saved['api_token']) {
                    $encrypted_token_data = base64_decode($saved['api_token']);
                    if (strlen($encrypted_token_data) > $iv_length) {
                        $iv = substr($encrypted_token_data, 0, $iv_length);
                        $encrypted = substr($encrypted_token_data, $iv_length);
                        $decrypted_token = openssl_decrypt($encrypted, $encryption_method, $encryption_key, 0, $iv);
                        if ($decrypted_token !== false) {
                            $api_token = $decrypted_token;
                        }
                    }
                }
                
                // Buscar outros campos se não fornecidos
                if (empty($api_url) && $saved['api_url']) {
                    $api_url = $saved['api_url'];
                }
                if (empty($instance_name) && $saved['instance_name']) {
                    $instance_name = $saved['instance_name'];
                }
                if (empty($whatsapp_number) && $saved['whatsapp_number']) {
                    $whatsapp_number = $saved['whatsapp_number'];
                }
            }
        }
        
        // Validações após buscar do banco
        if (empty($api_key)) {
            json_error('API Key é obrigatória', 400);
        }
        
        // URL da API é obrigatória apenas para Evolution API
        if ($provider === 'evolution' && empty($api_url)) {
            json_error('URL da API é obrigatória para Evolution API', 400);
        }
        
        // Para Twilio e Meta, validar campos obrigatórios
        if ($provider === 'twilio' && empty($api_token)) {
            json_error('API Token é obrigatório para Twilio', 400);
        }
        
        if ($provider === 'meta' && (empty($api_url) || empty($api_token))) {
            json_error('URL da API e API Token são obrigatórios para Meta', 400);
        }
        
        // Log para debug (sem expor valores completos)
        error_log("WhatsApp Test - Provider: $provider, URL: $api_url, Instance: $instance_name, API Key length: " . strlen($api_key) . ", Token: " . ($api_token ? 'present' : 'empty'));
        
        // Criar configuração temporária para teste
        $test_config = [
            'provider' => $provider,
            'api_url' => $api_url,
            'api_key' => $api_key,
            'api_token' => $api_token ?: null,
            'instance_name' => $instance_name,
            'whatsapp_number' => $whatsapp_number,
            'is_active' => true,
        ];
        
        // Mensagem de teste
        $message = "✅ *Teste de Configuração WhatsApp*\n\n";
        $message .= "Esta mensagem foi enviada automaticamente pelo FinFamily.\n\n";
        $message .= "📅 Data/Hora: " . date('d/m/Y H:i:s') . "\n\n";
        $message .= "_Se você recebeu esta mensagem, a integração está funcionando corretamente!_";
        
        // Usar SendWhatsAppService com configuração temporária
        $result = SendWhatsAppService::sendMessage($pdo, $family_id, $test_number, $message, [
            'config' => $test_config
        ]);
        
        if ($result['success']) {
            json_response([
                'message' => 'Mensagem de teste enviada com sucesso!',
                'message_id' => $result['message_id'] ?? null,
                'provider' => $result['provider']
            ]);
        } else {
            json_error($result['error'] ?: 'Erro ao enviar mensagem de teste', 500);
        }
        
    } catch (Exception $e) {
        error_log("Erro ao testar configurações de WhatsApp: " . $e->getMessage());
        json_error('Erro ao testar configurações: ' . $e->getMessage(), 500);
    }
}

