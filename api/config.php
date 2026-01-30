<?php
/**
 * Configuração da API
 */

// Iniciar output buffering para capturar qualquer output acidental
ob_start();

// Desabilitar exibição de erros (apenas log)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Handler de erros para garantir JSON mesmo em erros fatais
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        while (ob_get_level()) {
            ob_end_clean();
        }
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Erro interno do servidor']);
        exit;
    }
});

// Handler de exceções não capturadas
set_exception_handler(function($exception) {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Erro interno do servidor']);
    exit;
});

// Headers CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Responder OPTIONS para preflight
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(200);
    exit;
}

// Função para ler arquivo .env
function loadEnv($file) {
    $env = [];
    if (!file_exists($file)) return $env;
    
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim(trim($value), '"\'');
        }
    }
    return $env;
}

// Carregar configurações do .env
$env_file = __DIR__ . '/../.env';
$env = loadEnv($env_file);

$db_host = $env['DB_HOST'] ?? 'localhost';
$db_user = $env['DB_USER'] ?? 'root';
$db_password = $env['DB_PASS'] ?? $env['DB_PASSWORD'] ?? '';
$db_name = $env['DB_NAME'] ?? 'family_finance';
$db_port = $env['DB_PORT'] ?? 3306;

// Chave de criptografia para senhas SMTP (usar variável de ambiente em produção)
$encryption_key = $env['ENCRYPTION_KEY'] ?? 'default_key_change_in_production_' . md5(__DIR__);
$encryption_method = 'AES-256-CBC';

// Conectar ao banco
try {
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Limpar qualquer output anterior
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Erro ao conectar ao banco de dados']);
    exit;
}

// Função para gerar UUID
function generate_uuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * Obter a role do usuário ('admin' ou 'user').
 * Retorna 'user' como padrão se não encontrar.
 */
function get_user_role(PDO $pdo, string $user_id): string {
    try {
        $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $role = $stmt->fetchColumn();
        return $role ?: 'user';
    } catch (PDOException $e) {
        error_log("Erro ao buscar role do usuário $user_id: " . $e->getMessage());
        return 'user';
    }
}

// Função para retornar resposta JSON
function json_response($data, $status = 200) {
    // Limpar qualquer output anterior
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Função para retornar erro
function json_error($message, $status = 400) {
    // Limpar qualquer output anterior
    while (ob_get_level()) {
        ob_end_clean();
    }
    json_response(['error' => $message], $status);
}

// Função para obter dados do corpo da requisição
function get_request_body() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Função para verificar se usuário está autenticado (via session ou token)
function get_current_user_id() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return $_SESSION['user_id'] ?? null;
}

// Função para hash de senha
function hash_password($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

// Função para verificar senha
function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

// Carregar PHPMailer se disponível
$vendor_autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($vendor_autoload)) {
    require_once $vendor_autoload;
}

/**
 * Função para enviar e-mail usando PHPMailer
 * @param array $config Configurações SMTP: host, port, encryption, user, password, from_email, from_name
 * @param string $to E-mail do destinatário
 * @param string $subject Assunto do e-mail
 * @param string $body Corpo do e-mail (HTML)
 * @param string|null $altBody Corpo alternativo (texto simples)
 * @param PDO|null $pdo Conexão com o banco (opcional, para log)
 * @param string|null $family_id ID da família (opcional, para log)
 * @param string $email_type Tipo de e-mail: 'invitation', 'test', 'notification' (opcional, para log)
 * @param string|null $recipient_name Nome do destinatário (opcional, para log)
 * @return array ['success' => bool, 'message' => string]
 */
function send_email($config, $to, $subject, $body, $altBody = null, $pdo = null, $family_id = null, $email_type = 'notification', $recipient_name = null) {
    // Verificar se PHPMailer está disponível
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        return [
            'success' => false,
            'message' => 'PHPMailer não está instalado. Execute: composer install'
        ];
    }
    
    try {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        
        // Configurações do servidor SMTP
        $mail->isSMTP();
        $mail->Host = $config['host'];
        $mail->SMTPAuth = true;
        $mail->Username = $config['user'];
        $mail->Password = $config['password'];
        $mail->SMTPSecure = $config['encryption'] === 'ssl' ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $config['port'];
        $mail->CharSet = 'UTF-8';
        
        // Remetente
        $mail->setFrom($config['from_email'], $config['from_name']);
        
        // Destinatário
        $mail->addAddress($to);
        
        // Conteúdo
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        if ($altBody) {
            $mail->AltBody = $altBody;
        }
        
        $mail->send();
        
        // Registrar no log de e-mails
        if ($pdo && $family_id) {
            log_email_sent($pdo, $family_id, $email_type, $to, $recipient_name, $subject, 'sent', null);
        }
        
        return ['success' => true, 'message' => 'E-mail enviado com sucesso'];
        
    } catch (Exception $e) {
        $errorInfo = isset($mail) ? $mail->ErrorInfo : $e->getMessage();
        error_log("Erro ao enviar e-mail para $to: " . $errorInfo);
        error_log("Stack trace: " . $e->getTraceAsString());
        
        // Registrar falha no log
        if ($pdo && $family_id) {
            log_email_sent($pdo, $family_id, $email_type, $to, $recipient_name, $subject, 'failed', $errorInfo);
        }
        
        return [
            'success' => false,
            'message' => 'Erro ao enviar e-mail: ' . $errorInfo
        ];
    }
}

/**
 * Registrar envio de e-mail no histórico
 * @param PDO|null $pdo Conexão com o banco
 * @param string|null $family_id ID da família
 * @param string $email_type Tipo: 'invitation', 'test', 'notification'
 * @param string $recipient_email E-mail do destinatário
 * @param string|null $recipient_name Nome do destinatário
 * @param string $subject Assunto do e-mail
 * @param string $status Status: 'sent', 'failed', 'pending'
 * @param string|null $error_message Mensagem de erro (se falhou)
 * @param array|null $metadata Metadados adicionais
 */
function log_email_sent($pdo, $family_id, $email_type, $recipient_email, $recipient_name, $subject, $status, $error_message = null, $metadata = null) {
    if (!$pdo || !$family_id) {
        return; // Não logar se não tiver conexão ou família
    }
    
    try {
        $log_id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO email_logs (
                id, family_id, email_type, recipient_email, recipient_name,
                subject, status, error_message, metadata, sent_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $sent_at = ($status === 'sent') ? date('Y-m-d H:i:s') : null;
        $metadata_json = $metadata ? json_encode($metadata) : null;
        
        $stmt->execute([
            $log_id,
            $family_id,
            $email_type,
            $recipient_email,
            $recipient_name,
            $subject,
            $status,
            $error_message,
            $metadata_json,
            $sent_at,
        ]);
    } catch (PDOException $e) {
        error_log("Erro ao registrar log de e-mail: " . $e->getMessage());
        // Não falhar o envio se o log falhar
    }
}

/**
 * Buscar configurações de e-mail da família
 * @param PDO $pdo Conexão com o banco
 * @param string $family_id ID da família
 * @return array|null Configurações ou null se não encontrado
 */
function get_email_settings($pdo, $family_id) {
    try {
        // Primeiro, verificar se existe configuração (mesmo se inativa)
        $stmt = $pdo->prepare("
            SELECT smtp_host, smtp_user, smtp_password, smtp_port, smtp_encryption,
                   from_email, from_name, is_active
            FROM email_settings
            WHERE family_id = ?
            LIMIT 1
        ");
        $stmt->execute([$family_id]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            error_log("get_email_settings: Nenhuma configuração encontrada para família $family_id");
            return null;
        }
        
        // Verificar se está ativa
        if (!$settings['is_active']) {
            error_log("get_email_settings: Configurações encontradas mas estão inativas para família $family_id");
            return null;
        }
        
        error_log("get_email_settings: Configurações encontradas para família $family_id (Host: " . $settings['smtp_host'] . ")");
        
        // Descriptografar senha
        global $encryption_key, $encryption_method;
        $encrypted_data = base64_decode($settings['smtp_password']);
        $iv_length = openssl_cipher_iv_length($encryption_method);
        
        // Verificar se tem IV (novo formato) ou é apenas base64 (formato antigo)
        if (strlen($encrypted_data) > $iv_length) {
            $iv = substr($encrypted_data, 0, $iv_length);
            $encrypted = substr($encrypted_data, $iv_length);
            $decrypted_password = openssl_decrypt($encrypted, $encryption_method, $encryption_key, 0, $iv);
            if ($decrypted_password === false) {
                // Fallback para base64
                $decrypted_password = base64_decode($settings['smtp_password']);
            }
        } else {
            // Formato antigo (apenas base64)
            $decrypted_password = base64_decode($settings['smtp_password']);
        }
        
        return [
            'host' => $settings['smtp_host'],
            'port' => (int)$settings['smtp_port'],
            'encryption' => $settings['smtp_encryption'],
            'user' => $settings['smtp_user'],
            'password' => $decrypted_password,
            'from_email' => $settings['from_email'],
            'from_name' => $settings['from_name'],
        ];
    } catch (PDOException $e) {
        error_log("Erro ao buscar configurações de e-mail: " . $e->getMessage());
        return null;
    }
}

/**
 * Enviar e-mail de convite para membro da família
 * @param PDO $pdo Conexão com o banco
 * @param string $family_id ID da família
 * @param string $to E-mail do destinatário
 * @param string $full_name Nome completo do destinatário
 * @param string $token Token do convite
 * @param string|null $password Senha gerada (se cadastro completo)
 * @param string $invitation_type Tipo: 'pre_register' ou 'full_register'
 * @return array ['success' => bool, 'message' => string]
 */
function send_invitation_email($pdo, $family_id, $to, $full_name, $token, $password = null, $invitation_type = 'pre_register') {
    // Buscar configurações de e-mail
    $email_config = get_email_settings($pdo, $family_id);
    
    if (!$email_config) {
        error_log("Envio de e-mail falhou: Configurações SMTP não encontradas para família $family_id");
        return [
            'success' => false,
            'message' => 'Configurações de e-mail não encontradas. Configure o SMTP em Configurações > E-mail primeiro.'
        ];
    }
    
    error_log("Tentando enviar e-mail de convite para: $to (Família: $family_id, Tipo: $invitation_type)");
    
    // URL base (ajustar conforme necessário)
    $base_url = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost';
    $basename = '/family_finance';
    $accept_url = $base_url . $basename . '/accept-invitation?token=' . urlencode($token);
    
    // Criar template do e-mail
    if ($invitation_type === 'full_register') {
        // E-mail para cadastro completo (com credenciais)
        $subject = 'Convite para FinFamily - Suas credenciais';
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
                .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4F46E5; }
                .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Bem-vindo ao FinFamily!</h1>
                </div>
                <div class='content'>
                    <p>Olá, <strong>" . htmlspecialchars($full_name ?: $to) . "</strong>!</p>
                    <p>Você foi convidado para fazer parte de uma família no FinFamily.</p>
                    <p>Suas credenciais de acesso já foram criadas:</p>
                    <div class='credentials'>
                        <p><strong>E-mail:</strong> " . htmlspecialchars($to) . "</p>
                        <p><strong>Senha:</strong> <code style='background: #f0f0f0; padding: 5px 10px; border-radius: 3px;'>" . htmlspecialchars($password) . "</code></p>
                    </div>
                    <p style='color: #d32f2f;'><strong>⚠️ Importante:</strong> Guarde esta senha com segurança. Recomendamos alterá-la após o primeiro acesso.</p>
                    <p>Para aceitar o convite e ativar sua conta, clique no botão abaixo:</p>
                    <p style='text-align: center; margin: 30px 0;'>
                        <a href='" . htmlspecialchars($accept_url) . "' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-size: 18px; font-weight: 700; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; border: 2px solid rgba(255, 255, 255, 0.2);'>✨ Aceitar Convite e Ativar Conta ✨</a>
                    </p>
                    <style>
                        a[href*=\'accept-invitation\']:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 12px 24px rgba(102, 126, 234, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15) !important;
                        }
                    </style>
                    <p>Ou copie e cole este link no navegador:</p>
                    <p style='word-break: break-all; color: #4F46E5;'>" . htmlspecialchars($accept_url) . "</p>
                    <p style='margin-top: 20px;'>Após aceitar o convite, você poderá fazer login com suas credenciais:</p>
                    <p style='text-align: center;'>
                        <a href='" . htmlspecialchars($base_url . $basename . '/auth') . "' class='button' style='background: #10b981;'>Fazer Login</a>
                    </p>
                </div>
                <div class='footer'>
                    <p>Este convite expira em 7 dias.</p>
                    <p>Se você não solicitou este convite, pode ignorar este e-mail.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        $altBody = "Bem-vindo ao FinFamily!\n\nVocê foi convidado para fazer parte de uma família.\n\nCredenciais:\nE-mail: $to\nSenha: $password\n\nPara aceitar o convite e ativar sua conta, acesse:\n$accept_url\n\nApós aceitar, faça login em:\n$base_url$basename/auth\n\nEste convite expira em 7 dias.";
    } else {
        // E-mail para pré-cadastro (apenas link)
        $subject = 'Convite para FinFamily';
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
                .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Convite para FinFamily</h1>
                </div>
                <div class='content'>
                    <p>Olá, <strong>" . htmlspecialchars($full_name ?: $to) . "</strong>!</p>
                    <p>Você foi convidado para fazer parte de uma família no FinFamily.</p>
                    <p>Para aceitar o convite e criar sua conta, clique no botão abaixo:</p>
                    <p style='text-align: center;'>
                        <a href='" . htmlspecialchars($accept_url) . "' class='button'>Aceitar Convite</a>
                    </p>
                    <p>Ou copie e cole este link no navegador:</p>
                    <p style='word-break: break-all; color: #4F46E5;'>" . htmlspecialchars($accept_url) . "</p>
                    <p style='color: #666; font-size: 14px;'>Este link expira em 7 dias.</p>
                </div>
                <div class='footer'>
                    <p>Se você não solicitou este convite, pode ignorar este e-mail.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        $altBody = "Convite para FinFamily\n\nOlá, " . ($full_name ?: $to) . "!\n\nVocê foi convidado para fazer parte de uma família no FinFamily.\n\nPara aceitar o convite, acesse:\n$accept_url\n\nEste link expira em 7 dias.";
    }
    
    $result = send_email($email_config, $to, $subject, $body, $altBody, $pdo, $family_id, 'invitation', $full_name);
    
    // Se falhou, já foi logado na função send_email
    if (!$result['success']) {
        log_email_sent($pdo, $family_id, 'invitation', $to, $full_name, $subject, 'failed', $result['message']);
    }
    
    return $result;
}

