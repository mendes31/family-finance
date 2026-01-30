<?php
/**
 * API de Configurações de E-mail
 * Endpoints: GET/POST /api/email_settings.php?action=get|save|test
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
        handleGetEmailSettings();
        break;
    case 'save':
        handleSaveEmailSettings();
        break;
    case 'test':
        handleTestEmailSettings();
        break;
    default:
        json_error('Ação inválida', 400);
}

function handleGetEmailSettings() {
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
        
        // Buscar configurações de e-mail
        $stmt = $pdo->prepare("
            SELECT 
                id, smtp_host, smtp_user, smtp_port, smtp_encryption,
                from_email, from_name, is_active, created_at, updated_at
            FROM email_settings
            WHERE family_id = ?
            LIMIT 1
        ");
        $stmt->execute([$family_id]);
        $settings = $stmt->fetch();
        
        json_response(['settings' => $settings ?: null]);
        
    } catch (PDOException $e) {
        error_log("Erro ao buscar configurações de e-mail: " . $e->getMessage());
        json_error('Erro ao buscar configurações: ' . $e->getMessage(), 500);
    }
}

function handleSaveEmailSettings() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $smtp_host = trim($data['smtp_host'] ?? '');
    $smtp_user = trim($data['smtp_user'] ?? '');
    $smtp_password = trim($data['smtp_password'] ?? '');
    $smtp_port = (int)($data['smtp_port'] ?? 587);
    $smtp_encryption = $data['smtp_encryption'] ?? 'tls';
    $from_email = trim($data['from_email'] ?? '');
    $from_name = trim($data['from_name'] ?? '');
    
    // Validações
    if (empty($smtp_host)) {
        json_error('Servidor SMTP é obrigatório', 400);
    }
    
    if (empty($smtp_user) || !filter_var($smtp_user, FILTER_VALIDATE_EMAIL)) {
        json_error('E-mail SMTP inválido', 400);
    }
    
    if (empty($smtp_password)) {
        json_error('Senha SMTP é obrigatória', 400);
    }
    
    if ($smtp_port < 1 || $smtp_port > 65535) {
        json_error('Porta inválida', 400);
    }
    
    if (!in_array($smtp_encryption, ['none', 'tls', 'ssl'])) {
        json_error('Tipo de criptografia inválido', 400);
    }
    
    if (empty($from_email) || !filter_var($from_email, FILTER_VALIDATE_EMAIL)) {
        json_error('E-mail remetente inválido', 400);
    }
    
    if (empty($from_name)) {
        json_error('Nome remetente é obrigatório', 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Buscar família do usuário
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        
        if (!$membership || empty($membership['family_id'])) {
            $pdo->rollBack();
            
            // Verificar se o usuário existe e tem dados
            $stmt = $pdo->prepare("SELECT id, email FROM users WHERE id = ? LIMIT 1");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            error_log("Email Settings Save - Erro: User ID: $user_id não encontrado em family_members");
            if ($user) {
                error_log("Email Settings Save - Usuário existe: " . ($user['email'] ?? 'sem email'));
            }
            
            json_error('Você não pertence a uma família. Por favor, acesse a página "Família" e crie ou entre em uma família primeiro.', 403);
        }
        
        $family_id = $membership['family_id'];
        
        // Criptografar senha usando openssl_encrypt
        global $encryption_key, $encryption_method;
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($encryption_method));
        $encrypted_password = openssl_encrypt($smtp_password, $encryption_method, $encryption_key, 0, $iv);
        $encrypted_password = base64_encode($iv . $encrypted_password); // IV + dados criptografados
        
        // Verificar se já existe configuração
        $stmt = $pdo->prepare("SELECT id FROM email_settings WHERE family_id = ? LIMIT 1");
        $stmt->execute([$family_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Atualizar (garantir que is_active seja TRUE)
            $stmt = $pdo->prepare("
                UPDATE email_settings 
                SET smtp_host = ?, smtp_user = ?, smtp_password = ?, smtp_port = ?,
                    smtp_encryption = ?, from_email = ?, from_name = ?,
                    is_active = TRUE,
                    updated_at = NOW()
                WHERE family_id = ?
            ");
            $stmt->execute([
                $smtp_host,
                $smtp_user,
                $encrypted_password,
                $smtp_port,
                $smtp_encryption,
                $from_email,
                $from_name,
                $family_id,
            ]);
            error_log("Email Settings Save - Configurações atualizadas para família $family_id");
        } else {
            // Criar
            $settings_id = generate_uuid();
            $stmt = $pdo->prepare("
                INSERT INTO email_settings (
                    id, family_id, smtp_host, smtp_user, smtp_password, smtp_port,
                    smtp_encryption, from_email, from_name, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
            ");
            $stmt->execute([
                $settings_id,
                $family_id,
                $smtp_host,
                $smtp_user,
                $encrypted_password,
                $smtp_port,
                $smtp_encryption,
                $from_email,
                $from_name,
            ]);
            error_log("Email Settings Save - Configurações criadas para família $family_id (ID: $settings_id)");
        }
        
        $pdo->commit();
        
        json_response([
            'message' => 'Configurações salvas com sucesso',
            'settings' => [
                'smtp_host' => $smtp_host,
                'smtp_user' => $smtp_user,
                'smtp_port' => $smtp_port,
                'smtp_encryption' => $smtp_encryption,
                'from_email' => $from_email,
                'from_name' => $from_name,
            ],
        ]);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao salvar configurações de e-mail: " . $e->getMessage());
        json_error('Erro ao salvar configurações: ' . $e->getMessage(), 500);
    }
}

function handleTestEmailSettings() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $smtp_host = trim($data['smtp_host'] ?? '');
    $smtp_user = trim($data['smtp_user'] ?? '');
    $smtp_password = trim($data['smtp_password'] ?? '');
    $smtp_port = (int)($data['smtp_port'] ?? 587);
    $smtp_encryption = $data['smtp_encryption'] ?? 'tls';
    $from_email = trim($data['from_email'] ?? '');
    $from_name = trim($data['from_name'] ?? '');
    
    // Validações básicas
    if (empty($smtp_host) || empty($smtp_user) || empty($smtp_password)) {
        json_error('Configurações SMTP incompletas', 400);
    }
    
    try {
        // Verificar se PHPMailer está disponível
        if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            json_error('PHPMailer não está instalado. Execute: composer install', 500);
        }
        
        // Preparar configurações
        $email_config = [
            'host' => $smtp_host,
            'port' => $smtp_port,
            'encryption' => $smtp_encryption,
            'user' => $smtp_user,
            'password' => $smtp_password,
            'from_email' => $from_email,
            'from_name' => $from_name,
        ];
        
        // Enviar e-mail de teste para o próprio usuário
        $to = $smtp_user;
        $subject = 'Teste de Configuração SMTP - FinFamily';
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>✅ Teste de Configuração SMTP</h1>
                </div>
                <div class='content'>
                    <div class='success'>
                        <strong>Sucesso!</strong> Se você recebeu este e-mail, significa que a configuração do servidor SMTP está funcionando corretamente!
                    </div>
                    <p>Este é um e-mail de teste enviado automaticamente pelo sistema FinFamily.</p>
                    <p><strong>Configurações testadas:</strong></p>
                    <ul>
                        <li>Servidor: " . htmlspecialchars($smtp_host) . "</li>
                        <li>Porta: " . htmlspecialchars($smtp_port) . "</li>
                        <li>Criptografia: " . htmlspecialchars(strtoupper($smtp_encryption)) . "</li>
                        <li>Usuário: " . htmlspecialchars($smtp_user) . "</li>
                    </ul>
                    <hr>
                    <p><small>Enviado em " . date('d/m/Y H:i:s') . "</small></p>
                </div>
                <div class='footer'>
                    <p>FinFamily - Sistema de Gestão Financeira Familiar</p>
                </div>
            </div>
        </body>
        </html>
        ";
        $altBody = "Teste de Configuração SMTP - FinFamily\n\nSucesso! Se você recebeu este e-mail, significa que a configuração do servidor SMTP está funcionando corretamente!\n\nEnviado em " . date('d/m/Y H:i:s');
        
        // Buscar family_id do usuário
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        $family_id = $membership['family_id'] ?? null;
        
        $result = send_email($email_config, $to, $subject, $body, $altBody, $pdo, $family_id, 'test', $smtp_user);
        
        if ($result['success']) {
            json_response([
                'message' => 'E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.',
                'sent_to' => $to,
            ]);
        } else {
            json_error($result['message'], 500);
        }
        
    } catch (Exception $e) {
        error_log("Erro ao testar configurações de e-mail: " . $e->getMessage());
        json_error('Erro ao testar configurações: ' . $e->getMessage(), 500);
    }
}



