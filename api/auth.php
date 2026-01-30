<?php
/**
 * API de Autenticação
 * Endpoints: POST /api/auth.php?action=signup|signin|signout|session
 */

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'signup':
        handleSignUp();
        break;
    case 'signin':
        handleSignIn();
        break;
    case 'signout':
        handleSignOut();
        break;
    case 'session':
        handleGetSession();
        break;
    default:
        json_error('Ação inválida', 400);
}

function handleSignUp() {
    global $pdo;
    
    $data = get_request_body();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $fullName = $data['fullName'] ?? $data['name'] ?? '';
    
    // Validações
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('E-mail inválido', 400);
    }
    
    if (empty($password) || strlen($password) < 6) {
        json_error('Senha deve ter pelo menos 6 caracteres', 400);
    }
    
    if (empty($fullName) || strlen($fullName) < 2) {
        json_error('Nome deve ter pelo menos 2 caracteres', 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Verificar se email já existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            json_error('Este e-mail já está cadastrado', 409);
        }
        
        // Criar usuário
        $user_id = generate_uuid();
        $password_hash = hash_password($password);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, TRUE, NOW(), NOW())
        ");
        $stmt->execute([$user_id, $email, $password_hash]);
        
        // Criar perfil
        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, full_name, email, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$user_id, $fullName, $email]);
        
        // Criar role padrão
        $role_id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO user_roles (id, user_id, role, created_at)
            VALUES (?, ?, 'user', NOW())
        ");
        $stmt->execute([$role_id, $user_id]);
        
        $pdo->commit();
        
        // Criar sessão
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_email'] = $email;
        
        json_response([
            'user' => [
                'id' => $user_id,
                'email' => $email,
                'name' => $fullName,
            ],
            'message' => 'Conta criada com sucesso'
        ], 201);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_error('Erro ao criar conta: ' . $e->getMessage(), 500);
    }
}

function handleSignIn() {
    global $pdo;
    
    $data = get_request_body();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        json_error('E-mail e senha são obrigatórios', 400);
    }
    
    try {
        // Buscar usuário
        $stmt = $pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            error_log("Login falhou: Usuário não encontrado para email: $email");
            json_error('E-mail ou senha incorretos', 401);
        }
        
        // Verificar senha
        $password_valid = verify_password($password, $user['password_hash']);
        if (!$password_valid) {
            error_log("Login falhou: Senha incorreta para email: $email");
            // Log adicional para debug (remover em produção)
            error_log("Hash armazenado: " . substr($user['password_hash'], 0, 20) . "...");
            json_error('E-mail ou senha incorretos', 401);
        }
        
        // Buscar perfil
        $stmt = $pdo->prepare("SELECT full_name FROM profiles WHERE id = ?");
        $stmt->execute([$user['id']]);
        $profile = $stmt->fetch();
        
        // Criar sessão
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        
        json_response([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $profile['full_name'] ?? '',
            ],
            'message' => 'Login realizado com sucesso'
        ]);
        
    } catch (PDOException $e) {
        json_error('Erro ao fazer login: ' . $e->getMessage(), 500);
    }
}

function handleSignOut() {
    // Iniciar sessão se não estiver iniciada
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
    
    // Limpar dados da sessão
    $_SESSION = [];
    
    // Destruir cookie de sessão
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        @setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Destruir sessão
    @session_destroy();
    
    json_response(['message' => 'Logout realizado com sucesso']);
}

function handleGetSession() {
    global $pdo;
    
    $user_id = get_current_user_id();
    
    if (!$user_id) {
        json_response(['user' => null]);
    }
    
    try {
        // Buscar usuário e perfil
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, p.full_name as name
            FROM users u
            LEFT JOIN profiles p ON p.id = u.id
            WHERE u.id = ?
        ");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            session_destroy();
            json_response(['user' => null]);
        }
        
        json_response([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'] ?? '',
            ]
        ]);
        
    } catch (PDOException $e) {
        json_error('Erro ao verificar sessão: ' . $e->getMessage(), 500);
    }
}

