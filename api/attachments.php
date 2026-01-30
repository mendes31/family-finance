<?php
/**
 * API de Anexos de Transações
 * Endpoints: GET/POST/DELETE /api/attachments.php?action=list|upload|delete|download
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
        handleListAttachments();
        break;
    case 'upload':
        handleUploadAttachment();
        break;
    case 'delete':
        handleDeleteAttachment();
        break;
    case 'download':
        handleDownloadAttachment();
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

function handleListAttachments() {
    global $pdo;
    
    $transaction_id = $_GET['transaction_id'] ?? null;
    if (!$transaction_id) {
        json_error('ID da transação não informado', 400);
    }
    
    // Verificar se a transação pertence à família do usuário
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['attachments' => []]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT ta.*, u.email as uploaded_by_email
            FROM transaction_attachments ta
            INNER JOIN transactions t ON ta.transaction_id = t.id
            LEFT JOIN users u ON ta.uploaded_by = u.id
            WHERE ta.transaction_id = ? AND t.family_id = ?
            ORDER BY ta.created_at DESC
        ");
        $stmt->execute([$transaction_id, $family_id]);
        $attachments = $stmt->fetchAll();
        
        json_response(['attachments' => $attachments]);
    } catch (PDOException $e) {
        error_log("Erro ao listar anexos: " . $e->getMessage());
        json_error('Erro ao listar anexos', 500);
    }
}

function handleUploadAttachment() {
    global $pdo, $user_id;
    
    $transaction_id = $_POST['transaction_id'] ?? null;
    if (!$transaction_id) {
        json_error('ID da transação não informado', 400);
    }
    
    // Verificar se a transação pertence à família do usuário
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $stmt = $pdo->prepare("SELECT id FROM transactions WHERE id = ? AND family_id = ?");
    $stmt->execute([$transaction_id, $family_id]);
    $transaction = $stmt->fetch();
    
    if (!$transaction) {
        json_error('Transação não encontrada ou sem permissão', 404);
    }
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        json_error('Erro ao fazer upload do arquivo', 400);
    }
    
    $file = $_FILES['file'];
    $maxSize = 10 * 1024 * 1024; // 10MB
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp'];
    
    if ($file['size'] > $maxSize) {
        json_error('Arquivo muito grande. Tamanho máximo: 10MB', 400);
    }
    
    if (!in_array($file['type'], $allowedTypes)) {
        json_error('Tipo de arquivo não permitido. Permitidos: JPG, PNG, GIF, PDF, WEBP', 400);
    }
    
    try {
        // Criar diretório de uploads se não existir
        $uploadDir = __DIR__ . '/../uploads/attachments/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Gerar nome único para o arquivo
        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = generate_uuid() . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;
        
        // Mover arquivo
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            json_error('Erro ao salvar arquivo', 500);
        }
        
        // Salvar no banco
        $attachment_id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO transaction_attachments (
                id, transaction_id, file_name, file_path, file_size, file_type, mime_type, uploaded_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $relativePath = '/family_finance/uploads/attachments/' . $fileName;
        $stmt->execute([
            $attachment_id,
            $transaction_id,
            $file['name'],
            $relativePath,
            $file['size'],
            $fileExtension,
            $file['type'],
            $user_id,
        ]);
        
        // Buscar anexo criado
        $stmt = $pdo->prepare("SELECT * FROM transaction_attachments WHERE id = ?");
        $stmt->execute([$attachment_id]);
        $attachment = $stmt->fetch();
        
        json_response(['attachment' => $attachment]);
    } catch (PDOException $e) {
        error_log("Erro ao fazer upload: " . $e->getMessage());
        json_error('Erro ao fazer upload do arquivo', 500);
    }
}

function handleDeleteAttachment() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $attachment_id = $data['id'] ?? null;
    
    if (!$attachment_id) {
        json_error('ID do anexo não informado', 400);
    }
    
    // Verificar se o anexo pertence a uma transação da família do usuário
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT ta.*, ta.file_path
            FROM transaction_attachments ta
            INNER JOIN transactions t ON ta.transaction_id = t.id
            WHERE ta.id = ? AND t.family_id = ?
        ");
        $stmt->execute([$attachment_id, $family_id]);
        $attachment = $stmt->fetch();
        
        if (!$attachment) {
            json_error('Anexo não encontrado ou sem permissão', 404);
        }
        
        // Deletar arquivo físico
        $filePath = __DIR__ . '/../' . ltrim($attachment['file_path'], '/');
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        // Deletar do banco
        $stmt = $pdo->prepare("DELETE FROM transaction_attachments WHERE id = ?");
        $stmt->execute([$attachment_id]);
        
        json_response(['success' => true]);
    } catch (PDOException $e) {
        error_log("Erro ao deletar anexo: " . $e->getMessage());
        json_error('Erro ao deletar anexo', 500);
    }
}

function handleDownloadAttachment() {
    global $pdo;
    
    $attachment_id = $_GET['id'] ?? null;
    if (!$attachment_id) {
        http_response_code(400);
        die('ID do anexo não informado');
    }
    
    // Verificar se o anexo pertence a uma transação da família do usuário
    $family_id = getFamilyId();
    if (!$family_id) {
        http_response_code(404);
        die('Família não encontrada');
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT ta.*
            FROM transaction_attachments ta
            INNER JOIN transactions t ON ta.transaction_id = t.id
            WHERE ta.id = ? AND t.family_id = ?
        ");
        $stmt->execute([$attachment_id, $family_id]);
        $attachment = $stmt->fetch();
        
        if (!$attachment) {
            http_response_code(404);
            die('Anexo não encontrado ou sem permissão');
        }
        
        // Construir caminho correto do arquivo
        // file_path está salvo como: /family_finance/uploads/attachments/nome.pdf
        // Precisamos remover /family_finance e construir o caminho absoluto
        $filePath = $attachment['file_path'];
        
        // Se começa com /family_finance, remover
        if (strpos($filePath, '/family_finance') === 0) {
            $filePath = substr($filePath, strlen('/family_finance'));
        }
        
        // Se começa com /, remover
        $filePath = ltrim($filePath, '/');
        
        // Construir caminho absoluto a partir da raiz do projeto
        // __DIR__ é api/, então __DIR__ . '/../' é a raiz do projeto
        $absolutePath = __DIR__ . '/../' . $filePath;
        
        // Normalizar caminho (resolver .. e .)
        $absolutePath = realpath($absolutePath);
        
        // Verificar se o arquivo existe
        if (!$absolutePath || !file_exists($absolutePath)) {
            error_log("Arquivo não encontrado: $absolutePath");
            error_log("file_path original: " . $attachment['file_path']);
            error_log("file_path processado: " . $filePath);
            error_log("Caminho base: " . __DIR__ . '/../');
            http_response_code(404);
            die('Arquivo não encontrado: ' . basename($attachment['file_name']));
        }
        
        // Enviar arquivo
        header('Content-Type: ' . $attachment['mime_type']);
        header('Content-Disposition: attachment; filename="' . $attachment['file_name'] . '"');
        header('Content-Length: ' . filesize($absolutePath));
        readfile($absolutePath);
        exit;
    } catch (PDOException $e) {
        error_log("Erro ao baixar anexo: " . $e->getMessage());
        http_response_code(500);
        die('Erro ao baixar arquivo');
    }
}

