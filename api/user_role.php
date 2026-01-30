<?php
/**
 * API de Role do Usuário
 * Endpoints: GET /api/user_role.php
 */

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$user_id = get_current_user_id();
if (!$user_id) {
    json_error('Usuário não autenticado', 401);
}

try {
    $stmt = $pdo->prepare("
        SELECT role
        FROM user_roles
        WHERE user_id = ?
        LIMIT 1
    ");
    $stmt->execute([$user_id]);
    $role = $stmt->fetch();
    
    json_response(['role' => $role ? $role['role'] : null]);
} catch (PDOException $e) {
    error_log("Erro ao buscar role: " . $e->getMessage());
    json_error('Erro ao buscar role', 500);
}

