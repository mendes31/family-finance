<?php
/**
 * API de Cartões de Crédito
 * Endpoints: GET/POST /api/credit_cards.php?action=list|create|update|delete
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
        handleListCreditCards();
        break;
    case 'create':
        handleCreateCreditCard();
        break;
    case 'update':
        handleUpdateCreditCard();
        break;
    case 'delete':
        handleDeleteCreditCard();
        break;
    case 'invoice':
        handleGetCardInvoice();
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

function handleListCreditCards() {
    global $pdo, $user_id;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['credit_cards' => []]);
        return;
    }
    
    $is_active = isset($_GET['is_active']) ? (bool)$_GET['is_active'] : null;
    $memberId = $_GET['memberId'] ?? null;
    
    // Controle de acesso por role:
    // - admin: pode ver todos os cartões da família e filtrar por membro
    // - user: vê apenas seus próprios cartões, ignorando memberId enviado pelo cliente
    $role = get_user_role($pdo, $user_id);
    $targetUserId = null;
    if ($role === 'admin') {
        $targetUserId = $memberId ?: null; // null = todos; id = apenas daquele membro
    } else {
        $targetUserId = $user_id; // usuário comum só vê os próprios cartões
    }
    
    try {
        $sql = "SELECT * FROM credit_cards WHERE family_id = ?";
        $params = [$family_id];
        
        if ($targetUserId) {
            $sql .= " AND holder_id = ?";
            $params[] = $targetUserId;
        }
        
        if ($is_active !== null) {
            $sql .= " AND is_active = ?";
            $params[] = $is_active ? 1 : 0;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $cards = $stmt->fetchAll();
        
        json_response(['credit_cards' => $cards]);
    } catch (PDOException $e) {
        error_log("Erro ao listar cartões: " . $e->getMessage());
        json_error('Erro ao listar cartões', 500);
    }
}

function handleCreateCreditCard() {
    global $pdo;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $data = get_request_body();
    
    // Validações
    if (empty($data['name'])) {
        json_error('Nome do cartão é obrigatório', 400);
    }
    
    if (empty($data['brand'])) {
        json_error('Bandeira é obrigatória', 400);
    }
    
    if (empty($data['credit_limit']) || $data['credit_limit'] <= 0) {
        json_error('Limite inválido', 400);
    }
    
    if (empty($data['closing_day']) || $data['closing_day'] < 1 || $data['closing_day'] > 31) {
        json_error('Dia de fechamento inválido (deve ser entre 1 e 31)', 400);
    }
    
    if (empty($data['due_day']) || $data['due_day'] < 1 || $data['due_day'] > 31) {
        json_error('Dia de vencimento inválido (deve ser entre 1 e 31)', 400);
    }
    
    try {
        $card_id = generate_uuid();
        
        global $user_id;
        
        $stmt = $pdo->prepare("
            INSERT INTO credit_cards (id, name, brand, color, holder_id, family_id, credit_limit, closing_day, due_day, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ");
        
        $stmt->execute([
            $card_id,
            $data['name'],
            $data['brand'],
            $data['color'] ?? null,
            $user_id,
            $family_id,
            $data['credit_limit'],
            (int)$data['closing_day'],
            (int)$data['due_day'],
        ]);
        
        // Buscar cartão criado
        $stmt = $pdo->prepare("SELECT * FROM credit_cards WHERE id = ?");
        $stmt->execute([$card_id]);
        $card = $stmt->fetch();
        
        json_response(['credit_card' => $card]);
    } catch (PDOException $e) {
        error_log("Erro ao criar cartão: " . $e->getMessage());
        json_error('Erro ao criar cartão', 500);
    }
}

function handleUpdateCreditCard() {
    global $pdo, $user_id;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $data = get_request_body();
    $card_id = $data['id'] ?? null;
    
    if (!$card_id) {
        json_error('ID do cartão não informado', 400);
    }
    
    // Verificar se o cartão pertence à família
    $stmt = $pdo->prepare("SELECT id FROM credit_cards WHERE id = ? AND family_id = ?");
    $stmt->execute([$card_id, $family_id]);
    if (!$stmt->fetch()) {
        json_error('Cartão não encontrado', 404);
    }
    
    $allowed_fields = ['name', 'brand', 'color', 'credit_limit', 'closing_day', 'due_day', 'is_active'];
    $updates = [];
    $values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            if ($field === 'is_active') {
                $values[] = $data[$field] ? 1 : 0;
            } elseif ($field === 'color') {
                // Tratar cor: string vazia, null ou 'default' vira null
                $colorValue = $data[$field];
                if ($colorValue === '' || $colorValue === null || $colorValue === 'default') {
                    $values[] = null;
                } else {
                    $values[] = $colorValue;
                }
            } else {
                $values[] = $data[$field];
            }
        }
    }
    
    if (empty($updates)) {
        json_error('Nenhum campo para atualizar', 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $values[] = $card_id;
    
    try {
        $sql = "UPDATE credit_cards SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Buscar cartão atualizado
        $stmt = $pdo->prepare("SELECT * FROM credit_cards WHERE id = ?");
        $stmt->execute([$card_id]);
        $card = $stmt->fetch();
        
        json_response(['credit_card' => $card]);
    } catch (PDOException $e) {
        error_log("Erro ao atualizar cartão: " . $e->getMessage());
        json_error('Erro ao atualizar cartão', 500);
    }
}

function handleDeleteCreditCard() {
    global $pdo, $user_id;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $card_id = $_GET['id'] ?? $_POST['id'] ?? null;
    
    if (!$card_id) {
        json_error('ID do cartão não informado', 400);
    }
    
    // Verificar se o cartão pertence à família
    $stmt = $pdo->prepare("SELECT id FROM credit_cards WHERE id = ? AND family_id = ?");
    $stmt->execute([$card_id, $family_id]);
    if (!$stmt->fetch()) {
        json_error('Cartão não encontrado', 404);
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM credit_cards WHERE id = ?");
        $stmt->execute([$card_id]);
        
        json_response(['message' => 'Cartão excluído com sucesso']);
    } catch (PDOException $e) {
        error_log("Erro ao excluir cartão: " . $e->getMessage());
        json_error('Erro ao excluir cartão', 500);
    }
}

function handleGetCardInvoice() {
    global $pdo, $user_id;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $card_id = $_GET['card_id'] ?? null;
    if (!$card_id) {
        json_error('ID do cartão não informado', 400);
    }
    
    $memberId = $_GET['memberId'] ?? null;
    
    // Controle de acesso por role:
    // - admin: pode ver todas as transações da família e filtrar por membro
    // - user: vê apenas suas próprias transações, ignorando memberId enviado pelo cliente
    $role = get_user_role($pdo, $user_id);
    $targetUserId = null;
    if ($role === 'admin') {
        $targetUserId = $memberId ?: null; // null = todos; id = apenas daquele membro
    } else {
        $targetUserId = $user_id; // usuário comum só vê os próprios lançamentos
    }
    
    // Obter mês/ano selecionado ou usar mês/ano atual
    $selectedMonth = isset($_GET['month']) ? (int)$_GET['month'] : null;
    $selectedYear = isset($_GET['year']) ? (int)$_GET['year'] : null;
    
    try {
        // Buscar informações do cartão
        $stmt = $pdo->prepare("SELECT * FROM credit_cards WHERE id = ? AND family_id = ?");
        $stmt->execute([$card_id, $family_id]);
        $card = $stmt->fetch();
        
        if (!$card) {
            json_error('Cartão não encontrado', 404);
        }
        
        // Calcular período para a fatura baseado no mês/ano selecionado
        // A FATURA ATUAL deve mostrar todas as transações que VENCEM (due_date) no mês/ano selecionado
        $today = new DateTime();
        $currentMonth = $selectedMonth ? $selectedMonth : (int)$today->format('m');
        $currentYear = $selectedYear ? $selectedYear : (int)$today->format('Y');
        
        // Calcular primeiro e último dia do mês/ano selecionado para filtrar por vencimento
        $invoiceStartDate = new DateTime();
        $invoiceStartDate->setDate($currentYear, $currentMonth, 1); // Primeiro dia do mês
        
        $invoiceEndDate = new DateTime();
        $invoiceEndDate->setDate($currentYear, $currentMonth, 1);
        $invoiceEndDate->modify('last day of this month'); // Último dia do mês
        
        // Buscar transações que VENCEM (due_date) no mês/ano selecionado
        // A fatura atual mostra todas as transações que vencem naquele mês
        // Inclui TODAS as transações (exceto canceladas), independente do status
        $sql = "
            SELECT 
                SUM(amount) as total,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE credit_card_id = ?
            AND family_id = ?
            AND payment_method = 'credit_card'
            AND status != 'cancelled'
        ";
        $params = [$card_id, $family_id];
        
        if ($targetUserId) {
            $sql .= " AND user_id = ?";
            $params[] = $targetUserId;
        }
        
        $sql .= " AND (
                (due_date IS NOT NULL AND due_date >= ? AND due_date <= ?)
                OR (due_date IS NULL AND date >= ? AND date <= ?)
            )";
        $params[] = $invoiceStartDate->format('Y-m-d');
        $params[] = $invoiceEndDate->format('Y-m-d');
        $params[] = $invoiceStartDate->format('Y-m-d');
        $params[] = $invoiceEndDate->format('Y-m-d');
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invoice_data = $stmt->fetch();
        
        $currentInvoiceTotal = $invoice_data['total'] ? (float)$invoice_data['total'] : 0;
        $transactionCount = (int)($invoice_data['transaction_count'] ?? 0);
        
        // Calcular TOTAL de todas as parcelas abertas (pendentes ou em atraso)
        // Isso é usado para calcular o valor disponível (limite - todas as parcelas abertas)
        // IMPORTANTE: Considera TODAS as parcelas abertas, independente do mês de vencimento
        $sql = "
            SELECT 
                SUM(amount) as total,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE credit_card_id = ?
            AND family_id = ?
            AND payment_method = 'credit_card'
            AND status IN ('pending', 'overdue')
        ";
        $params = [$card_id, $family_id];
        
        if ($targetUserId) {
            $sql .= " AND user_id = ?";
            $params[] = $targetUserId;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $all_open_installments = $stmt->fetch();
        
        $totalOpenAmount = $all_open_installments['total'] ? (float)$all_open_installments['total'] : 0;
        
        // Calcular saldo disponível (limite - todas as parcelas abertas)
        $creditLimit = (float)$card['credit_limit'];
        $availableBalance = $creditLimit - $totalOpenAmount;
        
        // Calcular fatura do próximo período (próximo mês)
        $nextInvoiceMonth = $currentMonth + 1;
        $nextInvoiceYear = $currentYear;
        if ($nextInvoiceMonth > 12) {
            $nextInvoiceMonth = 1;
            $nextInvoiceYear += 1;
        }
        
        $nextInvoiceStartDate = new DateTime();
        $nextInvoiceStartDate->setDate($nextInvoiceYear, $nextInvoiceMonth, 1);
        
        $nextInvoiceEndDate = new DateTime();
        $nextInvoiceEndDate->setDate($nextInvoiceYear, $nextInvoiceMonth, 1);
        $nextInvoiceEndDate->modify('last day of this month');
        
        // Buscar transações que VENCEM no próximo mês
        $sql = "
            SELECT 
                SUM(amount) as total,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE credit_card_id = ?
            AND family_id = ?
            AND payment_method = 'credit_card'
            AND status != 'cancelled'
        ";
        $params = [$card_id, $family_id];
        
        if ($targetUserId) {
            $sql .= " AND user_id = ?";
            $params[] = $targetUserId;
        }
        
        $sql .= " AND (
                (due_date IS NOT NULL AND due_date >= ? AND due_date <= ?)
                OR (due_date IS NULL AND date >= ? AND date <= ?)
            )";
        $params[] = $nextInvoiceStartDate->format('Y-m-d');
        $params[] = $nextInvoiceEndDate->format('Y-m-d');
        $params[] = $nextInvoiceStartDate->format('Y-m-d');
        $params[] = $nextInvoiceEndDate->format('Y-m-d');
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $next_invoice_data = $stmt->fetch();
        
        $nextInvoiceTotal = $next_invoice_data['total'] ? (float)$next_invoice_data['total'] : 0;
        
        // Percentual de uso baseado no total usado (todas as parcelas abertas)
        $usedPercentage = $creditLimit > 0 ? ($totalOpenAmount / $creditLimit) * 100 : 0;
        
        json_response([
            'current_invoice' => [
                'total' => $currentInvoiceTotal,
                'transaction_count' => $transactionCount,
                'start_date' => $invoiceStartDate->format('Y-m-d'),
                'end_date' => $invoiceEndDate->format('Y-m-d'),
            ],
            'next_invoice' => [
                'total' => $nextInvoiceTotal,
                'start_date' => $nextInvoiceStartDate->format('Y-m-d'),
                'end_date' => $nextInvoiceEndDate->format('Y-m-d'),
            ],
            'credit_limit' => $creditLimit,
            'available_balance' => $availableBalance,
            'total_open_amount' => $totalOpenAmount,
            'used_percentage' => $usedPercentage,
        ]);
    } catch (PDOException $e) {
        error_log("Erro ao calcular fatura do cartão: " . $e->getMessage());
        json_error('Erro ao calcular fatura do cartão', 500);
    }
}

