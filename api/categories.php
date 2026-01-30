<?php
/**
 * API de Categorias
 * Endpoints: GET/POST /api/categories.php?action=list|create|update|delete
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
        handleListCategories();
        break;
    case 'create':
        handleCreateCategory();
        break;
    case 'update':
        handleUpdateCategory();
        break;
    case 'delete':
        handleDeleteCategory();
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

function handleListCategories() {
    global $pdo;
    
    $family_id = getFamilyId();
    $type = $_GET['type'] ?? null;
    
    try {
        $sql = "SELECT * FROM categories WHERE ";
        
        if ($family_id) {
            $sql .= "(family_id = ? OR is_default = 1)";
            $params = [$family_id];
        } else {
            $sql .= "is_default = 1";
            $params = [];
        }
        
        if ($type) {
            $sql .= " AND type = ?";
            $params[] = $type;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $categories = $stmt->fetchAll();
        
        json_response(['categories' => $categories]);
    } catch (PDOException $e) {
        error_log("Erro ao listar categorias: " . $e->getMessage());
        json_error('Erro ao listar categorias', 500);
    }
}

function handleCreateCategory() {
    global $pdo;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $data = get_request_body();
    
    if (empty($data['name']) || strlen($data['name']) < 2) {
        json_error('Nome da categoria deve ter pelo menos 2 caracteres', 400);
    }
    
    if (empty($data['type']) || !in_array($data['type'], ['income', 'expense', 'investment'])) {
        json_error('Tipo inválido', 400);
    }
    
    try {
        $category_id = generate_uuid();
        
        $stmt = $pdo->prepare("
            INSERT INTO categories (id, name, type, icon, color, family_id, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
        ");
        
        $stmt->execute([
            $category_id,
            $data['name'],
            $data['type'],
            $data['icon'] ?? null,
            $data['color'] ?? null,
            $family_id,
        ]);
        
        // Buscar categoria criada
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$category_id]);
        $category = $stmt->fetch();
        
        json_response(['category' => $category]);
    } catch (PDOException $e) {
        error_log("Erro ao criar categoria: " . $e->getMessage());
        json_error('Erro ao criar categoria', 500);
    }
}

function handleUpdateCategory() {
    global $pdo;
    
    $family_id = getFamilyId();
    $data = get_request_body();
    $category_id = $data['id'] ?? null;
    
    if (!$category_id) {
        json_error('ID da categoria não informado', 400);
    }
    
    // Verificar se a categoria pertence à família (não pode editar categorias padrão)
    $stmt = $pdo->prepare("SELECT id, family_id, is_default FROM categories WHERE id = ?");
    $stmt->execute([$category_id]);
    $category = $stmt->fetch();
    
    if (!$category) {
        json_error('Categoria não encontrada', 404);
    }
    
    if ($category['is_default']) {
        json_error('Não é possível editar categorias padrão', 403);
    }
    
    if ($category['family_id'] !== $family_id) {
        json_error('Categoria não pertence à sua família', 403);
    }
    
    $allowed_fields = ['name', 'icon', 'color'];
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
    
    $values[] = $category_id;
    
    try {
        $sql = "UPDATE categories SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Buscar categoria atualizada
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$category_id]);
        $category = $stmt->fetch();
        
        json_response(['category' => $category]);
    } catch (PDOException $e) {
        error_log("Erro ao atualizar categoria: " . $e->getMessage());
        json_error('Erro ao atualizar categoria', 500);
    }
}

function handleDeleteCategory() {
    global $pdo;
    
    $family_id = getFamilyId();
    $category_id = $_GET['id'] ?? $_POST['id'] ?? null;
    
    if (!$category_id) {
        json_error('ID da categoria não informado', 400);
    }
    
    // Verificar se a categoria pertence à família (não pode deletar categorias padrão)
    $stmt = $pdo->prepare("SELECT id, family_id, is_default FROM categories WHERE id = ?");
    $stmt->execute([$category_id]);
    $category = $stmt->fetch();
    
    if (!$category) {
        json_error('Categoria não encontrada', 404);
    }
    
    if ($category['is_default']) {
        json_error('Não é possível deletar categorias padrão', 403);
    }
    
    if ($category['family_id'] !== $family_id) {
        json_error('Categoria não pertence à sua família', 403);
    }
    
    // Verificar se há transações usando esta categoria
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM transactions WHERE category_id = ?");
    $stmt->execute([$category_id]);
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        json_error('Não é possível deletar categoria que possui transações associadas', 409);
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$category_id]);
        
        json_response(['message' => 'Categoria excluída com sucesso']);
    } catch (PDOException $e) {
        error_log("Erro ao excluir categoria: " . $e->getMessage());
        json_error('Erro ao excluir categoria', 500);
    }
}

