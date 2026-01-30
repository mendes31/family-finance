<?php
/**
 * API de Metas Financeiras
 * Endpoints: GET/POST /api/goals.php?action=list|create|update|delete
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
    case 'list':
        handleListGoals();
        break;
    case 'create':
        handleCreateGoal();
        break;
    case 'update':
        handleUpdateGoal();
        break;
    case 'delete':
        handleDeleteGoal();
        break;
    default:
        json_error('Ação inválida', 400);
}

function getFamilyId() {
    global $pdo, $user_id;
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user_id]);
    $member = $stmt->fetch();
    return $member ? $member['family_id'] : null;
}

function handleListGoals() {
    global $pdo;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['goals' => []]);
        return;
    }
    
    $is_completed = isset($_GET['is_completed']) ? (bool)$_GET['is_completed'] : null;
    
    try {
        $sql = "SELECT * FROM financial_goals WHERE family_id = ?";
        $params = [$family_id];
        
        if ($is_completed !== null) {
            $sql .= " AND is_completed = ?";
            $params[] = $is_completed ? 1 : 0;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $goals = $stmt->fetchAll();
        
        // Converter valores DECIMAL para float
        foreach ($goals as &$goal) {
            $goal['target_amount'] = (float)$goal['target_amount'];
            $goal['current_amount'] = (float)$goal['current_amount'];
            $goal['is_completed'] = (bool)$goal['is_completed'];
        }
        
        json_response(['goals' => $goals]);
    } catch (PDOException $e) {
        error_log("Erro ao listar metas: " . $e->getMessage());
        json_error('Erro ao listar metas', 500);
    }
}

function handleCreateGoal() {
    global $pdo;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $data = get_request_body();
    
    if (empty($data['name']) || strlen($data['name']) < 2) {
        json_error('Nome da meta deve ter pelo menos 2 caracteres', 400);
    }
    
    if (empty($data['target_amount']) || $data['target_amount'] <= 0) {
        json_error('Valor alvo deve ser maior que zero', 400);
    }
    
    try {
        $goal_id = generate_uuid();
        
        $stmt = $pdo->prepare("
            INSERT INTO financial_goals (id, name, target_amount, current_amount, deadline, family_id, is_completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
        ");
        
        $stmt->execute([
            $goal_id,
            $data['name'],
            $data['target_amount'],
            $data['current_amount'] ?? 0,
            $data['deadline'] ?? null,
            $family_id,
        ]);
        
        // Buscar meta criada
        $stmt = $pdo->prepare("SELECT * FROM financial_goals WHERE id = ?");
        $stmt->execute([$goal_id]);
        $goal = $stmt->fetch();
        
        $goal['target_amount'] = (float)$goal['target_amount'];
        $goal['current_amount'] = (float)$goal['current_amount'];
        $goal['is_completed'] = (bool)$goal['is_completed'];
        
        json_response(['goal' => $goal]);
    } catch (PDOException $e) {
        error_log("Erro ao criar meta: " . $e->getMessage());
        json_error('Erro ao criar meta', 500);
    }
}

function handleUpdateGoal() {
    global $pdo;
    
    $family_id = getFamilyId();
    $data = get_request_body();
    $goal_id = $data['id'] ?? null;
    
    if (!$goal_id) {
        json_error('ID da meta não informado', 400);
    }
    
    // Verificar se a meta pertence à família
    $stmt = $pdo->prepare("SELECT id, family_id FROM financial_goals WHERE id = ?");
    $stmt->execute([$goal_id]);
    $goal = $stmt->fetch();
    
    if (!$goal) {
        json_error('Meta não encontrada', 404);
    }
    
    if ($goal['family_id'] !== $family_id) {
        json_error('Meta não pertence à sua família', 403);
    }
    
    $allowed_fields = ['name', 'target_amount', 'current_amount', 'deadline', 'is_completed'];
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
    
    $values[] = $goal_id;
    
    try {
        $sql = "UPDATE financial_goals SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Buscar meta atualizada
        $stmt = $pdo->prepare("SELECT * FROM financial_goals WHERE id = ?");
        $stmt->execute([$goal_id]);
        $goal = $stmt->fetch();
        
        $goal['target_amount'] = (float)$goal['target_amount'];
        $goal['current_amount'] = (float)$goal['current_amount'];
        $goal['is_completed'] = (bool)$goal['is_completed'];
        
        json_response(['goal' => $goal]);
    } catch (PDOException $e) {
        error_log("Erro ao atualizar meta: " . $e->getMessage());
        json_error('Erro ao atualizar meta', 500);
    }
}

function handleDeleteGoal() {
    global $pdo;
    
    $family_id = getFamilyId();
    $goal_id = $_GET['id'] ?? $_POST['id'] ?? null;
    
    if (!$goal_id) {
        json_error('ID da meta não informado', 400);
    }
    
    // Verificar se a meta pertence à família
    $stmt = $pdo->prepare("SELECT id, family_id FROM financial_goals WHERE id = ?");
    $stmt->execute([$goal_id]);
    $goal = $stmt->fetch();
    
    if (!$goal) {
        json_error('Meta não encontrada', 404);
    }
    
    if ($goal['family_id'] !== $family_id) {
        json_error('Meta não pertence à sua família', 403);
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM financial_goals WHERE id = ?");
        $stmt->execute([$goal_id]);
        
        json_response(['message' => 'Meta excluída com sucesso']);
    } catch (PDOException $e) {
        error_log("Erro ao excluir meta: " . $e->getMessage());
        json_error('Erro ao excluir meta', 500);
    }
}

