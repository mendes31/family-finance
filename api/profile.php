<?php
/**
 * API de Perfil
 * Endpoints: GET/POST /api/profile.php?action=get|update
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
        handleGetProfile();
        break;
    case 'update':
        handleUpdateProfile();
        break;
    default:
        json_error('Ação inválida', 400);
}

function handleGetProfile() {
    global $pdo, $user_id;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, full_name, email, phone_whatsapp, avatar_url, created_at, updated_at
            FROM profiles
            WHERE id = ?
        ");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();
        
        if (!$profile) {
            // Se não existe perfil, criar um básico
            $stmt = $pdo->prepare("
                SELECT email FROM users WHERE id = ?
            ");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            if ($user) {
                $stmt = $pdo->prepare("
                    INSERT INTO profiles (id, full_name, email, created_at, updated_at)
                    VALUES (?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$user_id, $user['email'], $user['email']]);
                
                $stmt = $pdo->prepare("
                    SELECT id, full_name, email, phone_whatsapp, avatar_url, created_at, updated_at
                    FROM profiles
                    WHERE id = ?
                ");
                $stmt->execute([$user_id]);
                $profile = $stmt->fetch();
            }
        }
        
        json_response(['profile' => $profile]);
    } catch (PDOException $e) {
        error_log("Erro ao buscar perfil: " . $e->getMessage());
        json_error('Erro ao buscar perfil', 500);
    }
}

function handleUpdateProfile() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    
    $allowed_fields = ['full_name', 'phone_whatsapp', 'avatar_url'];
    $updates = [];
    $values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        json_error('Nenhum campo para atualizar', 400);
    }
    
    $values[] = $user_id;
    
    try {
        $sql = "UPDATE profiles SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Buscar perfil atualizado
        $stmt = $pdo->prepare("
            SELECT id, full_name, email, phone_whatsapp, avatar_url, created_at, updated_at
            FROM profiles
            WHERE id = ?
        ");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();
        
        json_response(['profile' => $profile]);
    } catch (PDOException $e) {
        error_log("Erro ao atualizar perfil: " . $e->getMessage());
        json_error('Erro ao atualizar perfil', 500);
    }
}

