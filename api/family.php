<?php
/**
 * API de Família
 * Endpoints: GET/POST /api/family.php?action=create|get|members
 */

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Ações que NÃO requerem autenticação
$public_actions = ['check_invitation', 'accept_invitation'];

// Verificar autenticação apenas para ações que requerem
if (!in_array($action, $public_actions)) {
    $user_id = get_current_user_id();
    if (!$user_id) {
        json_error('Usuário não autenticado', 401);
    }
} else {
    // Para ações públicas, user_id pode ser null
    $user_id = get_current_user_id(); // Pode ser null
}

switch ($action) {
    case 'create':
        handleCreateFamily();
        break;
    case 'get':
        handleGetFamily();
        break;
    case 'members':
        handleGetMembers();
        break;
    case 'invite':
        handleInviteMember();
        break;
    case 'invitations':
        handleGetInvitations();
        break;
    case 'cancel_invitation':
        handleCancelInvitation();
        break;
    case 'accept_invitation':
        handleAcceptInvitation();
        break;
    case 'check_invitation':
        handleCheckInvitation();
        break;
    case 'resend_invitation':
        handleResendInvitation();
        break;
    default:
        json_error('Ação inválida', 400);
}

function handleCreateFamily() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $family_name = $data['name'] ?? '';
    
    // Log para debug (remover em produção)
    error_log("Create Family - User ID: $user_id, Name: $family_name");
    
    if (empty($family_name) || strlen($family_name) < 2) {
        json_error('Nome da família deve ter pelo menos 2 caracteres', 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Verificar se usuário já tem família
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            json_error('Você já pertence a uma família', 409);
        }
        
        // Gerar UUID para família
        $family_id = generate_uuid();
        
        // Criar família
        $stmt = $pdo->prepare("INSERT INTO families (id, name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
        $stmt->execute([$family_id, $family_name]);
        
        // Adicionar usuário como membro
        $member_id = generate_uuid();
        $stmt = $pdo->prepare("INSERT INTO family_members (id, family_id, user_id, joined_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$member_id, $family_id, $user_id]);
        
        // Promover a admin (criar ou atualizar role)
        // Garantir que o criador da família seja sempre admin
        // Primeiro, remover qualquer role 'user' se existir
        $stmt = $pdo->prepare("DELETE FROM user_roles WHERE user_id = ? AND role = 'user'");
        $stmt->execute([$user_id]);
        
        // Verificar se já tem role admin
        $stmt = $pdo->prepare("SELECT id FROM user_roles WHERE user_id = ? AND role = 'admin' LIMIT 1");
        $stmt->execute([$user_id]);
        $existing_admin = $stmt->fetch();
        
        if (!$existing_admin) {
            // Criar role admin
            $role_id = generate_uuid();
            $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'admin', NOW())");
            $stmt->execute([$role_id, $user_id]);
        }
        
        $pdo->commit();
        
        json_response([
            'id' => $family_id,
            'name' => $family_name,
            'message' => 'Família criada com sucesso'
        ], 201);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_error('Erro ao criar família: ' . $e->getMessage(), 500);
    }
}

function handleGetFamily() {
    global $pdo, $user_id;
    
    try {
        // Buscar família do usuário
        $stmt = $pdo->prepare("
            SELECT fm.family_id 
            FROM family_members fm 
            WHERE fm.user_id = ? 
            LIMIT 1
        ");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        
        if (!$membership) {
            json_response(['family' => null]);
        }
        
        // Buscar detalhes da família
        $stmt = $pdo->prepare("
            SELECT id, name, created_at, updated_at 
            FROM families 
            WHERE id = ?
        ");
        $stmt->execute([$membership['family_id']]);
        $family = $stmt->fetch();
        
        if (!$family) {
            json_response(['family' => null]);
        }
        
        json_response(['family' => $family]);
        
    } catch (PDOException $e) {
        json_error('Erro ao buscar família: ' . $e->getMessage(), 500);
    }
}

function handleGetMembers() {
    global $pdo, $user_id;
    
    $family_id = $_GET['family_id'] ?? '';
    
    if (empty($family_id)) {
        json_error('family_id é obrigatório', 400);
    }
    
    try {
        // Verificar se usuário pertence à família
        $stmt = $pdo->prepare("SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$family_id, $user_id]);
        if (!$stmt->fetch()) {
            json_error('Você não pertence a esta família', 403);
        }
        
        // Buscar membros
        $stmt = $pdo->prepare("
            SELECT 
                fm.id,
                fm.user_id,
                fm.joined_at,
                p.full_name,
                p.email,
                p.avatar_url
            FROM family_members fm
            LEFT JOIN profiles p ON p.id = fm.user_id
            WHERE fm.family_id = ?
            ORDER BY fm.joined_at ASC
        ");
        $stmt->execute([$family_id]);
        $members = $stmt->fetchAll();
        
        json_response(['members' => $members]);
        
    } catch (PDOException $e) {
        json_error('Erro ao buscar membros: ' . $e->getMessage(), 500);
    }
}

function handleInviteMember() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $email = trim($data['email'] ?? '');
    $full_name = trim($data['full_name'] ?? '');
    $role = $data['role'] ?? 'user';
    $invitation_type = $data['invitation_type'] ?? 'pre_register';
    
    // Validações
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('E-mail inválido', 400);
    }
    
    if (!in_array($role, ['user', 'admin'])) {
        json_error('Perfil inválido', 400);
    }
    
    if (!in_array($invitation_type, ['pre_register', 'full_register'])) {
        json_error('Tipo de convite inválido', 400);
    }
    
    // Para cadastro completo, nome é obrigatório
    if ($invitation_type === 'full_register' && empty($full_name)) {
        json_error('Nome é obrigatório para cadastro completo', 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Buscar família do usuário
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $membership = $stmt->fetch();
        
        if (!$membership) {
            $pdo->rollBack();
            json_error('Você não pertence a uma família', 403);
        }
        
        $family_id = $membership['family_id'];
        
        // Verificar se usuário já é membro da família
        $stmt = $pdo->prepare("
            SELECT u.id 
            FROM users u
            INNER JOIN family_members fm ON fm.user_id = u.id
            WHERE u.email = ? AND fm.family_id = ?
            LIMIT 1
        ");
        $stmt->execute([$email, $family_id]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            json_error('Este e-mail já é membro da família', 409);
        }
        
        // Verificar se já existe convite pendente para este e-mail
        $stmt = $pdo->prepare("
            SELECT id FROM family_invitations 
            WHERE email = ? AND family_id = ? AND status = 'pending' AND expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([$email, $family_id]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            json_error('Já existe um convite pendente para este e-mail', 409);
        }
        
        // Gerar token único
        $token = bin2hex(random_bytes(32));
        
        // Gerar senha se for cadastro completo
        $password_hash = null;
        $generated_password = null;
        if ($invitation_type === 'full_register') {
            $generated_password = generate_random_password();
            $password_hash = hash_password($generated_password);
        }
        
        // Data de expiração (7 dias)
        $expires_at = date('Y-m-d H:i:s', strtotime('+7 days'));
        
        // Criar convite
        $invitation_id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO family_invitations (
                id, family_id, invited_by, email, full_name, role, invitation_type,
                token, password_hash, status, expires_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
        ");
        $stmt->execute([
            $invitation_id,
            $family_id,
            $user_id,
            $email,
            $full_name ?: null,
            $role,
            $invitation_type,
            $token,
            $password_hash,
            $expires_at,
        ]);
        
        $pdo->commit();
        
        // Tentar enviar e-mail com convite
        $email_result = send_invitation_email($pdo, $family_id, $email, $full_name, $token, $generated_password, $invitation_type);
        
        // Log do resultado do envio
        if ($email_result['success']) {
            error_log("E-mail de convite enviado com sucesso para: $email");
        } else {
            error_log("Erro ao enviar e-mail de convite para $email: " . $email_result['message']);
            // Não falhar a criação do convite se o e-mail falhar
            // O convite foi criado, apenas o e-mail não foi enviado
        }
        
        // Preparar resposta
        $response = [
            'invitation' => [
                'id' => $invitation_id,
                'email' => $email,
                'expires_at' => $expires_at,
            ],
            'message' => 'Convite criado com sucesso',
        ];
        
        // Adicionar informações sobre o envio do e-mail
        if ($email_result['success']) {
            $response['email_sent'] = true;
            $response['message'] = 'Convite criado e e-mail enviado com sucesso';
        } else {
            $response['email_sent'] = false;
            $response['email_error'] = $email_result['message'];
            $response['message'] = 'Convite criado, mas o e-mail não pôde ser enviado. Verifique as configurações SMTP.';
        }
        
        // Em desenvolvimento, retornar senha e token (remover em produção)
        if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
            $response['invitation']['token'] = $token;
            if ($generated_password) {
                $response['password'] = $generated_password;
            }
        }
        
        json_response($response, 201);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao criar convite: " . $e->getMessage());
        json_error('Erro ao criar convite: ' . $e->getMessage(), 500);
    }
}

function handleGetInvitations() {
    global $pdo, $user_id;
    
    $family_id = $_GET['family_id'] ?? '';
    
    if (empty($family_id)) {
        json_error('family_id é obrigatório', 400);
    }
    
    try {
        // Verificar se usuário pertence à família
        $stmt = $pdo->prepare("SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$family_id, $user_id]);
        if (!$stmt->fetch()) {
            json_error('Você não pertence a esta família', 403);
        }
        
        // Buscar convites pendentes
        $stmt = $pdo->prepare("
            SELECT 
                id, email, full_name, role, invitation_type, status, expires_at, created_at
            FROM family_invitations
            WHERE family_id = ? AND status = 'pending' AND expires_at > NOW()
            ORDER BY created_at DESC
        ");
        $stmt->execute([$family_id]);
        $invitations = $stmt->fetchAll();
        
        json_response(['invitations' => $invitations]);
        
    } catch (PDOException $e) {
        json_error('Erro ao buscar convites: ' . $e->getMessage(), 500);
    }
}

function handleCancelInvitation() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $invitation_id = $data['invitation_id'] ?? '';
    
    if (empty($invitation_id)) {
        json_error('ID do convite é obrigatório', 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Verificar se o convite existe e pertence à família do usuário
        $stmt = $pdo->prepare("
            SELECT fi.id, fi.family_id
            FROM family_invitations fi
            INNER JOIN family_members fm ON fm.family_id = fi.family_id
            WHERE fi.id = ? AND fm.user_id = ? AND fi.status = 'pending'
            LIMIT 1
        ");
        $stmt->execute([$invitation_id, $user_id]);
        $invitation = $stmt->fetch();
        
        if (!$invitation) {
            $pdo->rollBack();
            json_error('Convite não encontrado ou já foi processado', 404);
        }
        
        // Cancelar convite
        $stmt = $pdo->prepare("
            UPDATE family_invitations 
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$invitation_id]);
        
        $pdo->commit();
        
        json_response(['message' => 'Convite cancelado com sucesso']);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_error('Erro ao cancelar convite: ' . $e->getMessage(), 500);
    }
}

function handleAcceptInvitation() {
    global $pdo;
    
    $data = get_request_body();
    $token = $data['token'] ?? '';
    $password = $data['password'] ?? ''; // Para pré-cadastro, usuário define senha
    
    if (empty($token)) {
        json_error('Token do convite é obrigatório', 400);
    }
    
    try {
        $pdo->beginTransaction();
        
        // Buscar convite válido
        $stmt = $pdo->prepare("
            SELECT 
                id, family_id, email, full_name, role, invitation_type, password_hash, status, expires_at
            FROM family_invitations
            WHERE token = ? AND status = 'pending' AND expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $invitation = $stmt->fetch();
        
        if (!$invitation) {
            $pdo->rollBack();
            json_error('Convite inválido ou expirado', 404);
        }
        
        // Verificar se usuário já existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$invitation['email']]);
        $existing_user = $stmt->fetch();
        
        $user_id = null;
        
        if ($existing_user) {
            // Usuário já existe - apenas adicionar à família
            $user_id = $existing_user['id'];
            
            // Verificar se já é membro
            $stmt = $pdo->prepare("SELECT id FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1");
            $stmt->execute([$invitation['family_id'], $user_id]);
            if ($stmt->fetch()) {
                $pdo->rollBack();
                json_error('Você já é membro desta família', 409);
            }
        } else {
            // Criar novo usuário
            if ($invitation['invitation_type'] === 'pre_register') {
                // Pré-cadastro: senha é obrigatória
                if (empty($password) || strlen($password) < 6) {
                    $pdo->rollBack();
                    json_error('Senha deve ter pelo menos 6 caracteres', 400);
                }
                $password_hash = hash_password($password);
            } else {
                // Cadastro completo: usar senha gerada (já está como hash)
                if (empty($invitation['password_hash'])) {
                    $pdo->rollBack();
                    json_error('Erro: Senha não encontrada no convite. O convite pode estar corrompido.', 500);
                }
                $password_hash = $invitation['password_hash'];
                error_log("Aceitando convite full_register: Usando hash do convite para email: " . $invitation['email']);
            }
            
            $user_id = generate_uuid();
            $stmt = $pdo->prepare("
                INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
                VALUES (?, ?, ?, TRUE, NOW(), NOW())
            ");
            $stmt->execute([$user_id, $invitation['email'], $password_hash]);
            
            // Criar perfil
            $stmt = $pdo->prepare("
                INSERT INTO profiles (id, full_name, email, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$user_id, $invitation['full_name'] ?: $invitation['email'], $invitation['email']]);
            
            // Criar role
            $role_id = generate_uuid();
            $stmt = $pdo->prepare("
                INSERT INTO user_roles (id, user_id, role, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$role_id, $user_id, $invitation['role']]);
        }
        
        // Adicionar à família
        $member_id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO family_members (id, family_id, user_id, joined_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$member_id, $invitation['family_id'], $user_id]);
        
        // Marcar convite como aceito
        $stmt = $pdo->prepare("
            UPDATE family_invitations 
            SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$invitation['id']]);
        
        $pdo->commit();
        
        json_response([
            'message' => 'Convite aceito com sucesso',
            'user_id' => $user_id,
        ]);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao aceitar convite: " . $e->getMessage());
        json_error('Erro ao aceitar convite: ' . $e->getMessage(), 500);
    }
}

function handleCheckInvitation() {
    global $pdo;
    
    $token = $_GET['token'] ?? '';
    
    if (empty($token)) {
        json_error('Token do convite é obrigatório', 400);
    }
    
    try {
        // Buscar convite válido
        $stmt = $pdo->prepare("
            SELECT 
                id, email, full_name, role, invitation_type, status, expires_at
            FROM family_invitations
            WHERE token = ? AND status = 'pending' AND expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $invitation = $stmt->fetch();
        
        if (!$invitation) {
            json_error('Convite inválido ou expirado', 404);
        }
        
        json_response([
            'email' => $invitation['email'],
            'full_name' => $invitation['full_name'],
            'invitation_type' => $invitation['invitation_type'],
            'role' => $invitation['role'],
        ]);
        
    } catch (PDOException $e) {
        error_log("Erro ao verificar convite: " . $e->getMessage());
        json_error('Erro ao verificar convite: ' . $e->getMessage(), 500);
    }
}

// Função para gerar senha aleatória
function generate_random_password($length = 12) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $password;
}

