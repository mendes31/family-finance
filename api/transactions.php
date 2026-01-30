<?php
/**
 * API de Transações
 * Endpoints: GET/POST/DELETE /api/transactions.php?action=list|create|update|delete
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
        handleListTransactions();
        break;
    case 'create':
        handleCreateTransaction();
        break;
    case 'update':
        handleUpdateTransaction();
        break;
    case 'delete':
        handleDeleteTransaction();
        break;
    case 'summary':
        handleGetDashboardSummary();
        break;
    case 'monthly_trends':
        handleGetMonthlyTrends();
        break;
    case 'expenses_by_category':
        handleGetExpensesByCategory();
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

function handleListTransactions() {
    global $pdo, $user_id;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['transactions' => []]);
        return;
    }
    
    $type = $_GET['type'] ?? null;
    $status = $_GET['status'] ?? null;
    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
    $categoryId = $_GET['categoryId'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
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
    
    // Garantir que transações recorrentes estejam geradas para o período solicitado
    if ($startDate && $endDate) {
        ensureRecurringTransactions($pdo, $family_id, $startDate, $endDate);
    }
    
    try {
        $sql = "
            SELECT 
                t.*,
                t.purchase_date,
                t.due_date,
                c.id as category_id_full,
                c.name as category_name,
                c.icon as category_icon,
                c.color as category_color,
                u.id as created_by_user_id,
                COALESCE(p.full_name, u.email) as created_by_full_name,
                cc.id as credit_card_id_full,
                cc.name as credit_card_name,
                cc.brand as credit_card_brand,
                (SELECT COUNT(*) FROM transaction_attachments ta WHERE ta.transaction_id = t.id) as attachments_count,
                (SELECT MIN(ta.id) FROM transaction_attachments ta WHERE ta.transaction_id = t.id LIMIT 1) as first_attachment_id
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN profiles p ON p.id = u.id
            LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
            WHERE t.family_id = ?
        ";
        
        $params = [$family_id];
        
        if ($targetUserId) {
            $sql .= " AND t.user_id = ?";
            $params[] = $targetUserId;
        }
        
        if ($type) {
            $sql .= " AND t.type = ?";
            $params[] = $type;
        }
        
        if ($status) {
            $sql .= " AND t.status = ?";
            $params[] = $status;
        }
        
        if ($startDate) {
            // Filtrar por due_date quando disponível, senão por purchase_date
            $sql .= " AND COALESCE(t.due_date, t.purchase_date) >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            // Filtrar por due_date quando disponível, senão por purchase_date
            $sql .= " AND COALESCE(t.due_date, t.purchase_date) <= ?";
            $params[] = $endDate;
        }
        
        if ($categoryId) {
            $sql .= " AND t.category_id = ?";
            $params[] = $categoryId;
        }
        
        // Ordenar por due_date quando disponível, senão por purchase_date
        $sql .= " ORDER BY COALESCE(t.due_date, t.purchase_date) ASC, t.created_at ASC";
        
        if ($limit) {
            $sql .= " LIMIT ?";
            $params[] = $limit;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();
        
        // Formatar resposta similar ao Supabase
        $formatted = array_map(function($t) {
            return [
                'id' => $t['id'],
                'type' => $t['type'],
                'description' => $t['description'],
                'amount' => (float)$t['amount'],
                'purchase_date' => $t['purchase_date'] ?? null,
                'due_date' => $t['due_date'] ?? null,
                'category_id' => $t['category_id'],
                'user_id' => $t['user_id'],
                'family_id' => $t['family_id'],
                'payment_method' => $t['payment_method'],
                'status' => $t['status'] ?? 'pending', // Adicionar campo status
                'credit_card_id' => $t['credit_card_id'],
                'is_installment' => (bool)$t['is_installment'],
                'total_installments' => $t['total_installments'] ? (int)$t['total_installments'] : null,
                'current_installment' => $t['current_installment'] ? (int)$t['current_installment'] : null,
                'installment_group_id' => $t['installment_group_id'],
                'is_recurring' => isset($t['is_recurring']) ? (bool)$t['is_recurring'] : false,
                'recurrence_period' => $t['recurrence_period'] ?? null,
                'recurrence_end_date' => $t['recurrence_end_date'] ?? null,
                'recurrence_group_id' => $t['recurrence_group_id'] ?? null,
                'parent_recurrence_id' => $t['parent_recurrence_id'] ?? null,
                'notes' => $t['notes'],
                'attachment_url' => $t['attachment_url'],
                'attachments_count' => isset($t['attachments_count']) ? (int)$t['attachments_count'] : 0,
                'first_attachment_id' => $t['first_attachment_id'] ?? null,
                'created_by_user_id' => $t['created_by_user_id'] ?? null,
                'created_by_full_name' => $t['created_by_full_name'] ?? null,
                'created_at' => $t['created_at'],
                'updated_at' => $t['updated_at'],
                'categories' => $t['category_id'] ? [
                    'id' => $t['category_id_full'],
                    'name' => $t['category_name'],
                    'icon' => $t['category_icon'],
                    'color' => $t['category_color'],
                ] : null,
                'credit_cards' => $t['credit_card_id'] ? [
                    'id' => $t['credit_card_id_full'],
                    'name' => $t['credit_card_name'],
                    'brand' => $t['credit_card_brand'],
                ] : null,
            ];
        }, $transactions);
        
        json_response(['transactions' => $formatted]);
    } catch (PDOException $e) {
        error_log("Erro ao listar transações: " . $e->getMessage());
        json_error('Erro ao listar transações', 500);
    }
}

function handleCreateTransaction() {
    global $pdo, $user_id;
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 404);
    }
    
    $data = get_request_body();
    
    try {
        $pdo->beginTransaction();
        
        $transaction_id = generate_uuid();
        
        // Verificar se é recorrência
        $is_recurring = $data['is_recurring'] ?? false;
        $recurrence_period = $data['recurrence_period'] ?? null;
        $recurrence_end_date = $data['recurrence_end_date'] ?? null;
        $recurrence_group_id = null;
        
        if ($is_recurring && $recurrence_period) {
            $recurrence_group_id = generate_uuid();
        }
        
        // Determinar status padrão - todas as transações começam como 'pending'
        // O usuário deve marcar manualmente como 'paid' quando receber/pagar
        $default_status = 'pending';
        $status = $data['status'] ?? $default_status;
        
        // Usar purchase_date como date (campo date será preenchido com purchase_date para compatibilidade)
        $date_value = $data['purchase_date'] ?? $data['due_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            INSERT INTO transactions (
                id, type, description, amount, date, purchase_date, due_date, category_id, user_id, family_id,
                payment_method, status, credit_card_id, is_installment, total_installments,
                current_installment, installment_group_id, is_recurring, recurrence_period,
                recurrence_end_date, recurrence_group_id, parent_recurrence_id, notes, attachment_url,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $transaction_id,
            $data['type'],
            $data['description'],
            $data['amount'],
            $date_value, // Usar purchase_date ou due_date como fallback
            $data['purchase_date'] ?? null,
            $data['due_date'] ?? null,
            $data['category_id'] ?? null,
            $user_id,
            $family_id,
            $data['payment_method'],
            $status,
            $data['credit_card_id'] ?? null,
            $data['is_installment'] ?? false,
            $data['total_installments'] ?? null,
            $data['current_installment'] ?? null,
            $data['installment_group_id'] ?? null,
            $is_recurring ? 1 : 0,
            $recurrence_period,
            $recurrence_end_date,
            $recurrence_group_id,
            null, // parent_recurrence_id (esta é a transação pai)
            $data['notes'] ?? null,
            $data['attachment_url'] ?? null,
        ]);
        
        // Se for recorrente, gerar transações futuras
        if ($is_recurring && $recurrence_period) {
            generateRecurringTransactions(
                $pdo,
                $transaction_id,
                $recurrence_group_id,
                $data,
                $user_id,
                $family_id,
                $recurrence_period,
                $recurrence_end_date
            );
        }
        
        $pdo->commit();
        
        // Buscar transação criada
        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$transaction_id]);
        $transaction = $stmt->fetch();
        
        json_response(['transaction' => $transaction]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Erro ao criar transação: " . $e->getMessage());
        json_error('Erro ao criar transação', 500);
    }
}

function handleUpdateTransaction() {
    global $pdo, $user_id;
    
    $data = get_request_body();
    $transaction_id = $data['id'] ?? null;
    
    if (!$transaction_id) {
        json_error('ID da transação não informado', 400);
    }
    
    // Verificar se a transação pertence ao usuário/família
    $family_id = getFamilyId();
    
    // Buscar TODAS as informações necessárias da transação ANTES de qualquer atualização
    // Isso inclui dados de recorrência e parcelamento
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            status, 
            installment_group_id, 
            type,
            recurrence_group_id,
            parent_recurrence_id,
            is_recurring,
            description
        FROM transactions 
        WHERE id = ? AND family_id = ?
    ");
    $stmt->execute([$transaction_id, $family_id]);
    $transaction_data = $stmt->fetch();
    if (!$transaction_data) {
        json_error('Transação não encontrada', 404);
    }
    
    // Não permitir edição de transações já pagas/recebidas
    // Transações com status 'paid' não devem ser editadas (já foram pagas/recebidas)
    // Isso se aplica tanto para despesas quanto para receitas e investimentos
    if ($transaction_data['status'] === 'paid') {
        json_error('Não é possível editar transações já pagas/recebidas. Apenas transações pendentes podem ser editadas.', 400);
    }
    
    // Guardar dados originais para uso posterior (ANTES de atualizar)
    $old_installment_group_id = $transaction_data['installment_group_id'] ?? null;
    $original_recurrence_group_id = $transaction_data['recurrence_group_id'] ?? null;
    $original_parent_recurrence_id = $transaction_data['parent_recurrence_id'] ?? null;
    $original_is_recurring = (bool)($transaction_data['is_recurring'] ?? false);
    
    $allowed_fields = ['description', 'amount', 'purchase_date', 'due_date', 'category_id', 'payment_method', 'status', 'credit_card_id', 'notes'];
    $updates = [];
    $values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    // Tratar is_installment e total_installments separadamente
    if (isset($data['is_installment'])) {
        $updates[] = "is_installment = ?";
        $values[] = $data['is_installment'] ? 1 : 0;
        
        // Se não for parcelado, limpar total_installments e current_installment
        if (!$data['is_installment']) {
            $updates[] = "total_installments = NULL";
            $updates[] = "current_installment = NULL";
            $updates[] = "installment_group_id = NULL";
        } else if (isset($data['total_installments'])) {
            $updates[] = "total_installments = ?";
            $values[] = $data['total_installments'];
        }
    } else if (isset($data['total_installments'])) {
        // Se só total_installments foi enviado, atualizar
        $updates[] = "total_installments = ?";
        $values[] = $data['total_installments'];
    }
    
    // Permitir editar recorrência apenas se for transação pai (sem parent_recurrence_id)
    $stmt = $pdo->prepare("SELECT parent_recurrence_id, is_recurring FROM transactions WHERE id = ?");
    $stmt->execute([$transaction_id]);
    $current_transaction = $stmt->fetch();
    
    // Se não tem parent, pode editar recorrência
    if (!$current_transaction['parent_recurrence_id']) {
        if (isset($data['is_recurring'])) {
            $updates[] = "is_recurring = ?";
            $values[] = $data['is_recurring'] ? 1 : 0;
        }
        if (isset($data['recurrence_period'])) {
            $updates[] = "recurrence_period = ?";
            $values[] = $data['recurrence_period'];
        }
        if (isset($data['recurrence_end_date'])) {
            $updates[] = "recurrence_end_date = ?";
            $values[] = $data['recurrence_end_date'];
        }
    }
    
    if (empty($updates)) {
        json_error('Nenhum campo para atualizar', 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $values[] = $transaction_id;
    
    try {
        $pdo->beginTransaction();
        
        $sql = "UPDATE transactions SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Verificar se precisa criar parcelas (transação não parcelada sendo marcada como parcelada)
        // Converter is_installment para boolean se necessário
        $is_installment_bool = isset($data['is_installment']) ? (bool)$data['is_installment'] : false;
        $is_creating_installments = $is_installment_bool && !$old_installment_group_id;
        $new_total_installments = isset($data['total_installments']) ? (int)$data['total_installments'] : null;
        
        // Se está criando parcelas pela primeira vez
        if ($is_creating_installments && $new_total_installments && $new_total_installments > 1) {
            error_log("Creating installments: transaction_id=$transaction_id, total_installments=$new_total_installments");
            // Buscar dados atualizados da transação
            $stmt_current = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
            $stmt_current->execute([$transaction_id]);
            $current_data = $stmt_current->fetch();
            
            if ($current_data) {
                // Gerar novo installment_group_id
                $new_installment_group_id = generate_uuid();
                
                // Atualizar transação atual como primeira parcela
                $base_description = preg_replace('/\s*\(\d+\/\d+\)$/', '', $current_data['description']);
                
                // Calcular valor base por parcela
                $baseAmount = (float)$current_data['amount'];
                $baseInstallmentAmount = floor(($baseAmount / $new_total_installments) * 100) / 100;
                $totalBaseAmount = $baseInstallmentAmount * $new_total_installments;
                $difference = round(($baseAmount - $totalBaseAmount) * 100) / 100;
                
                // Preparar datas base
                $basePurchaseDate = $current_data['purchase_date'] 
                    ? new DateTime($current_data['purchase_date']) 
                    : ($current_data['due_date'] ? new DateTime($current_data['due_date']) : new DateTime());
                
                $baseDueDate = $current_data['due_date'] 
                    ? new DateTime($current_data['due_date'])
                    : clone $basePurchaseDate;
                
                // Se é cartão de crédito, calcular data de vencimento baseada no cartão
                if ($current_data['payment_method'] === 'credit_card' && $current_data['credit_card_id']) {
                    $stmt_card = $pdo->prepare("SELECT closing_day, due_day FROM credit_cards WHERE id = ?");
                    $stmt_card->execute([$current_data['credit_card_id']]);
                    $card_data = $stmt_card->fetch();
                    
                    if ($card_data) {
                        $purchaseDay = $basePurchaseDate->format('j');
                        $closingDay = $card_data['closing_day'];
                        $dueDay = $card_data['due_day'];
                        
                        if ($purchaseDay <= $closingDay) {
                            $baseDueDate = clone $basePurchaseDate;
                            $baseDueDate->modify('+1 month');
                        } else {
                            $baseDueDate = clone $basePurchaseDate;
                            $baseDueDate->modify('+2 months');
                        }
                        $baseDueDate->setDate($baseDueDate->format('Y'), $baseDueDate->format('m'), $dueDay);
                    }
                }
                
                // Calcular data de lançamento para primeira parcela
                $firstLaunchDate = clone $baseDueDate;
                if ($current_data['payment_method'] === 'credit_card') {
                    $firstLaunchDate->modify('-1 month');
                    $firstLaunchDate->setDate($firstLaunchDate->format('Y'), $firstLaunchDate->format('m'), 1);
                } else {
                    $firstLaunchDate->setDate($firstLaunchDate->format('Y'), $firstLaunchDate->format('m'), 1);
                }
                
                // Atualizar transação atual como primeira parcela
                $first_amount = ($new_total_installments === 1) ? $baseAmount : ($baseInstallmentAmount + ($new_total_installments === 1 ? $difference : 0));
                
                $stmt_update_first = $pdo->prepare("
                    UPDATE transactions SET 
                        description = ?,
                        amount = ?,
                        date = ?,
                        purchase_date = ?,
                        due_date = ?,
                        is_installment = 1,
                        total_installments = ?,
                        current_installment = 1,
                        installment_group_id = ?
                    WHERE id = ?
                ");
                $stmt_update_first->execute([
                    $base_description . ' (1/' . $new_total_installments . ')',
                    $first_amount,
                    $firstLaunchDate->format('Y-m-d'),
                    $basePurchaseDate->format('Y-m-d'),
                    $baseDueDate->format('Y-m-d'),
                    $new_total_installments,
                    $new_installment_group_id,
                    $transaction_id
                ]);
                
                // Criar parcelas restantes (2 até total_installments)
                for ($i = 2; $i <= $new_total_installments; $i++) {
                    // Calcular data de vencimento desta parcela
                    $installmentDueDate = clone $baseDueDate;
                    $installmentDueDate->modify('+' . ($i - 1) . ' months');
                    
                    // Calcular data de lançamento
                    $installmentDate = clone $installmentDueDate;
                    if ($current_data['payment_method'] === 'credit_card') {
                        $installmentDate->modify('-1 month');
                    }
                    $installmentDate->setDate($installmentDate->format('Y'), $installmentDate->format('m'), 1);
                    
                    // Valor da parcela (última recebe a diferença)
                    $isLast = ($i === $new_total_installments);
                    $installmentAmount = $isLast ? $baseInstallmentAmount + $difference : $baseInstallmentAmount;
                    
                    $new_id = generate_uuid();
                    $stmt_new = $pdo->prepare("
                        INSERT INTO transactions (
                            id, type, description, amount, date, purchase_date, due_date, category_id, user_id, family_id,
                            payment_method, status, credit_card_id, is_installment, total_installments,
                            current_installment, installment_group_id, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ");
                    // Garantir que valores NULL sejam tratados corretamente
                    $stmt_new->execute([
                        $new_id,
                        $current_data['type'],
                        $base_description . ' (' . $i . '/' . $new_total_installments . ')',
                        $installmentAmount,
                        $installmentDate->format('Y-m-d'),
                        $basePurchaseDate->format('Y-m-d'),
                        $installmentDueDate->format('Y-m-d'),
                        $current_data['category_id'] ?? null,
                        $user_id,
                        $family_id,
                        $current_data['payment_method'],
                        'pending',
                        $current_data['credit_card_id'] ?? null,
                        1,
                        $new_total_installments,
                        $i,
                        $new_installment_group_id,
                        $current_data['notes'] ?? null,
                    ]);
                }
                error_log("Successfully created " . ($new_total_installments - 1) . " additional installments for transaction_id=$transaction_id");
            } else {
                error_log("Error: current_data is null when trying to create installments for transaction_id=$transaction_id");
            }
        }
        
        // Se mudou o número de parcelas, excluir todas as pendentes e recriar baseado na transação atual
        $recalculate_installments = $data['recalculate_installments'] ?? false;
        
        if ($recalculate_installments && $old_installment_group_id && $new_total_installments && $new_total_installments > 1) {
            // Buscar primeira parcela (usar a que tem menor current_installment ou a transação atual)
            $stmt_first = $pdo->prepare("
                SELECT * FROM transactions 
                WHERE installment_group_id = ? 
                ORDER BY current_installment ASC 
                LIMIT 1
            ");
            $stmt_first->execute([$old_installment_group_id]);
            $first_data = $stmt_first->fetch();
            
            if ($first_data) {
                // Calcular valor total original (soma de todas as parcelas)
                $stmt_all = $pdo->prepare("
                    SELECT amount, status FROM transactions 
                    WHERE installment_group_id = ?
                ");
                $stmt_all->execute([$old_installment_group_id]);
                $all_installments = $stmt_all->fetchAll();
                
                $totalAmount = array_sum(array_column($all_installments, 'amount'));
                
                // Calcular valor já pago (apenas parcelas pagas)
                $paidAmount = 0;
                foreach ($all_installments as $inst) {
                    if ($inst['status'] === 'paid') {
                        $paidAmount += $inst['amount'];
                    }
                }
                
                // Valor restante = Total - Já Pago
                $remainingAmount = $totalAmount - $paidAmount;
                
                // Verificar status da transação atual ANTES de deletar
                $stmt_current_status = $pdo->prepare("SELECT status FROM transactions WHERE id = ?");
                $stmt_current_status->execute([$transaction_id]);
                $current_status_check = $stmt_current_status->fetch();
                $current_was_pending = $current_status_check && $current_status_check['status'] === 'pending';
                
                // Excluir TODAS as parcelas pendentes (exceto a atual se ela for pendente, pois vamos atualizar ela)
                $stmt_delete = $pdo->prepare("
                    DELETE FROM transactions 
                    WHERE installment_group_id = ? 
                    AND status = 'pending'
                    AND id != ?
                ");
                $stmt_delete->execute([$old_installment_group_id, $transaction_id]);
                
                // Usar dados da transação atual (que acabou de ser atualizada) ou da primeira parcela
                $stmt_current = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
                $stmt_current->execute([$transaction_id]);
                $current_data = $stmt_current->fetch();
                
                // Preparar dados base da primeira parcela (dados atualizados do formulário ou da primeira)
                $basePurchaseDate = isset($data['purchase_date']) && $data['purchase_date'] 
                    ? new DateTime($data['purchase_date']) 
                    : ($current_data['purchase_date'] ? new DateTime($current_data['purchase_date']) : ($current_data['due_date'] ? new DateTime($current_data['due_date']) : new DateTime()));
                
                // Calcular data de vencimento base (primeira parcela)
                $baseDueDate = isset($data['due_date']) && $data['due_date'] 
                    ? new DateTime($data['due_date'])
                    : ($current_data['due_date'] ? new DateTime($current_data['due_date']) : clone $basePurchaseDate);
                
                // Se é cartão de crédito, calcular data de vencimento baseada no cartão
                if ($current_data['payment_method'] === 'credit_card' && $current_data['credit_card_id']) {
                    $stmt_card = $pdo->prepare("SELECT closing_day, due_day FROM credit_cards WHERE id = ?");
                    $stmt_card->execute([$current_data['credit_card_id']]);
                    $card_data = $stmt_card->fetch();
                    
                    if ($card_data) {
                        $purchaseDay = $basePurchaseDate->format('j');
                        $closingDay = $card_data['closing_day'];
                        $dueDay = $card_data['due_day'];
                        
                        // Se compra antes ou no dia de fechamento, vence no mês seguinte
                        // Se compra depois do fechamento, vence no mês após o próximo
                        if ($purchaseDay <= $closingDay) {
                            $baseDueDate = clone $basePurchaseDate;
                            $baseDueDate->modify('+1 month');
                        } else {
                            $baseDueDate = clone $basePurchaseDate;
                            $baseDueDate->modify('+2 months');
                        }
                        $baseDueDate->setDate($baseDueDate->format('Y'), $baseDueDate->format('m'), $dueDay);
                    }
                }
                
                // Calcular valor base por parcela (distribuir valor restante)
                $baseInstallmentAmount = floor(($remainingAmount / $new_total_installments) * 100) / 100;
                $totalBaseAmount = $baseInstallmentAmount * $new_total_installments;
                $difference = round(($remainingAmount - $totalBaseAmount) * 100) / 100;
                
                // Recriar a primeira parcela (pendente) com os novos dados
                $update_first = [];
                $update_first_values = [];
                
                if (isset($data['description'])) {
                    $update_first[] = "description = ?";
                    $update_first_values[] = preg_replace('/\s*\(\d+\/\d+\)$/', '', $data['description']) . ' (1/' . $new_total_installments . ')';
                } else {
                    $base_description = preg_replace('/\s*\(\d+\/\d+\)$/', '', $current_data['description']);
                    $update_first[] = "description = ?";
                    $update_first_values[] = $base_description . ' (1/' . $new_total_installments . ')';
                }
                
                $update_first[] = "amount = ?";
                $update_first_values[] = ($new_total_installments === 1) ? $remainingAmount : ($baseInstallmentAmount + ($new_total_installments === 1 ? $difference : 0));
                
                $update_first[] = "status = ?";
                $update_first_values[] = 'pending';
                
                $update_first[] = "purchase_date = ?";
                $update_first_values[] = $basePurchaseDate->format('Y-m-d');
                
                $update_first[] = "due_date = ?";
                $update_first_values[] = $baseDueDate->format('Y-m-d');
                
                // Calcular data de lançamento para primeira parcela
                $firstLaunchDate = clone $baseDueDate;
                if ($current_data['payment_method'] === 'credit_card') {
                    $firstLaunchDate->modify('-1 month');
                    $firstLaunchDate->setDate($firstLaunchDate->format('Y'), $firstLaunchDate->format('m'), 1);
                } else {
                    $firstLaunchDate->setDate($firstLaunchDate->format('Y'), $firstLaunchDate->format('m'), 1);
                }
                
                $update_first[] = "date = ?";
                $update_first_values[] = $firstLaunchDate->format('Y-m-d');
                
                $update_first[] = "total_installments = ?";
                $update_first_values[] = $new_total_installments;
                
                $update_first[] = "current_installment = ?";
                $update_first_values[] = 1;
                
                if (isset($data['category_id'])) {
                    $update_first[] = "category_id = ?";
                    $update_first_values[] = $data['category_id'];
                }
                if (isset($data['payment_method'])) {
                    $update_first[] = "payment_method = ?";
                    $update_first_values[] = $data['payment_method'];
                }
                if (isset($data['credit_card_id'])) {
                    $update_first[] = "credit_card_id = ?";
                    $update_first_values[] = $data['credit_card_id'];
                }
                if (isset($data['notes'])) {
                    $update_first[] = "notes = ?";
                    $update_first_values[] = $data['notes'];
                }
                
                // Recriar primeira parcela (pode ser a atual ou uma nova)
                // Se a transação atual estava pendente, atualiza ela; senão cria nova
                if ($current_was_pending && $current_data) {
                    // Atualizar transação atual como primeira parcela
                    $update_first_values[] = $transaction_id;
                    $stmt_update_first = $pdo->prepare("
                        UPDATE transactions SET " . implode(', ', $update_first) . " WHERE id = ?
                    ");
                    $stmt_update_first->execute($update_first_values);
                    $start_from = 2; // Próxima parcela começa do 2
                } else {
                    // Se a atual estava paga, criar nova primeira parcela
                    $first_id = generate_uuid();
                    $base_description = isset($data['description']) 
                        ? preg_replace('/\s*\(\d+\/\d+\)$/', '', $data['description'])
                        : preg_replace('/\s*\(\d+\/\d+\)$/', '', $current_data['description']);
                    
                    $first_amount = ($new_total_installments === 1) ? $remainingAmount : ($baseInstallmentAmount + ($new_total_installments === 1 ? $difference : 0));
                    
                    $stmt_insert_first = $pdo->prepare("
                        INSERT INTO transactions (
                            id, type, description, amount, date, purchase_date, due_date, category_id, user_id, family_id,
                            payment_method, status, credit_card_id, is_installment, total_installments,
                            current_installment, installment_group_id, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ");
                    $stmt_insert_first->execute([
                        $first_id,
                        $current_data['type'],
                        $base_description . ' (1/' . $new_total_installments . ')',
                        $first_amount,
                        $firstLaunchDate->format('Y-m-d'),
                        $basePurchaseDate->format('Y-m-d'),
                        $baseDueDate->format('Y-m-d'),
                        isset($data['category_id']) ? $data['category_id'] : $current_data['category_id'],
                        $user_id,
                        $family_id,
                        isset($data['payment_method']) ? $data['payment_method'] : $current_data['payment_method'],
                        'pending',
                        isset($data['credit_card_id']) ? $data['credit_card_id'] : $current_data['credit_card_id'],
                        1,
                        $new_total_installments,
                        1,
                        $old_installment_group_id,
                        isset($data['notes']) ? $data['notes'] : $current_data['notes'],
                    ]);
                    $start_from = 2; // Próxima parcela começa do 2
                }
                
                // Criar novas parcelas restantes
                for ($i = $start_from; $i <= $new_total_installments; $i++) {
                    // Calcular data de vencimento desta parcela
                    $installmentDueDate = clone $baseDueDate;
                    $installmentDueDate->modify('+' . ($i - 1) . ' months');
                    
                    // Calcular data de lançamento
                    $installmentDate = clone $installmentDueDate;
                    if ($current_data['payment_method'] === 'credit_card') {
                        $installmentDate->modify('-1 month');
                    }
                    $installmentDate->setDate($installmentDate->format('Y'), $installmentDate->format('m'), 1);
                    
                    // Valor da parcela (última recebe a diferença)
                    $isLast = ($i === $new_total_installments);
                    $installmentAmount = $isLast ? $baseInstallmentAmount + $difference : $baseInstallmentAmount;
                    
                    // Descrição base sem número de parcela
                    $base_description = isset($data['description']) 
                        ? preg_replace('/\s*\(\d+\/\d+\)$/', '', $data['description'])
                        : preg_replace('/\s*\(\d+\/\d+\)$/', '', $current_data['description']);
                    
                    $new_id = generate_uuid();
                    $stmt_new = $pdo->prepare("
                        INSERT INTO transactions (
                            id, type, description, amount, date, purchase_date, due_date, category_id, user_id, family_id,
                            payment_method, status, credit_card_id, is_installment, total_installments,
                            current_installment, installment_group_id, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ");
                    $stmt_new->execute([
                        $new_id,
                        $current_data['type'],
                        $base_description . ' (' . $i . '/' . $new_total_installments . ')',
                        $installmentAmount,
                        $installmentDate->format('Y-m-d'),
                        $basePurchaseDate->format('Y-m-d'),
                        $installmentDueDate->format('Y-m-d'),
                        isset($data['category_id']) ? $data['category_id'] : $current_data['category_id'],
                        $user_id,
                        $family_id,
                        isset($data['payment_method']) ? $data['payment_method'] : $current_data['payment_method'],
                        'pending',
                        isset($data['credit_card_id']) ? $data['credit_card_id'] : $current_data['credit_card_id'],
                        1,
                        $new_total_installments,
                        $i,
                        $old_installment_group_id,
                        isset($data['notes']) ? $data['notes'] : $current_data['notes'],
                    ]);
                }
                
                // Atualizar número de parcelas em todas as parcelas pagas (se houver)
                $stmt_update_count = $pdo->prepare("
                    UPDATE transactions 
                    SET total_installments = ? 
                    WHERE installment_group_id = ? AND status = 'paid'
                ");
                $stmt_update_count->execute([$new_total_installments, $old_installment_group_id]);
            }
        }
        
        // Se for parcelado e o usuário quiser atualizar outras parcelas abertas
        // (mas apenas se NÃO for para recalcular parcelas, pois isso já foi tratado acima)
        $update_installments = $data['update_installments'] ?? false;
        $installment_group_id = $old_installment_group_id;
        if ($update_installments && $installment_group_id && !$recalculate_installments) {
            // Buscar a data da transação atual para filtrar apenas parcelas futuras
            $stmt_current_date_inst = $pdo->prepare("SELECT purchase_date, due_date FROM transactions WHERE id = ? AND family_id = ?");
            $stmt_current_date_inst->execute([$transaction_id, $family_id]);
            $current_transaction_date_inst = $stmt_current_date_inst->fetch();
            $current_purchase_date_inst = $current_transaction_date_inst && $current_transaction_date_inst['purchase_date'] ? $current_transaction_date_inst['purchase_date'] : null;
            $current_due_date_inst = $current_transaction_date_inst && $current_transaction_date_inst['due_date'] ? $current_transaction_date_inst['due_date'] : null;
            
            // IMPORTANTE: Atualizar apenas parcelas FUTURAS (due_date >= data da parcela atual)
            // e apenas as que estão PENDENTES (pending ou overdue)
            // Parcelas já pagas não devem ser atualizadas
            // Usar COALESCE(due_date, purchase_date) para comparar com a data de vencimento quando disponível
            $stmt = $pdo->prepare("
                SELECT id, current_installment, due_date, purchase_date 
                FROM transactions 
                WHERE installment_group_id = ? 
                AND id != ? 
                AND family_id = ?
                AND status IN ('pending', 'overdue')
                AND COALESCE(due_date, purchase_date) >= ?
                ORDER BY COALESCE(due_date, purchase_date) ASC
            ");
            $comparison_date = $current_due_date_inst ? $current_due_date_inst : $current_purchase_date_inst;
            $stmt->execute([$installment_group_id, $transaction_id, $family_id, $comparison_date]);
            $other_installments = $stmt->fetchAll();
            
            // Atualizar cada parcela com os mesmos dados (exceto valor, que é proporcional)
            foreach ($other_installments as $installment) {
                $installment_updates = [];
                $installment_values = [];
                
                // Campos que podem ser atualizados em todas as parcelas
                $fields_to_update = ['description', 'category_id', 'payment_method', 'credit_card_id', 'notes'];
                
                // Atualizar purchase_date se fornecido (todas as parcelas têm a mesma data de compra)
                if (isset($data['purchase_date']) && $data['purchase_date']) {
                    $installment_updates[] = "purchase_date = ?";
                    $installment_values[] = $data['purchase_date'];
                }
                
                // Calcular e atualizar due_date se fornecido
                if (isset($data['due_date']) && $data['due_date']) {
                    // Usar a data de vencimento da primeira parcela (da transação atual) como base
                    // E calcular as próximas parcelas baseado no número da parcela
                    $base_due_date = new DateTime($data['due_date']);
                    $current_installment = (int)$installment['current_installment'];
                    
                    // A primeira parcela já foi atualizada, então começar da segunda (índice 1)
                    // Se current_installment é 2, adicionar 1 mês; se é 3, adicionar 2 meses, etc.
                    $months_to_add = $current_installment - 1;
                    $new_due_date = clone $base_due_date;
                    if ($months_to_add > 0) {
                        $new_due_date->modify("+{$months_to_add} months");
                    }
                    
                    $installment_updates[] = "due_date = ?";
                    $installment_values[] = $new_due_date->format('Y-m-d');
                }
                
                // Atualizar outros campos
                foreach ($fields_to_update as $field) {
                    if (isset($data[$field])) {
                        $installment_updates[] = "$field = ?";
                        $installment_values[] = $data[$field];
                    }
                }
                
                if (!empty($installment_updates)) {
                    $installment_values[] = $installment['id'];
                    $installment_sql = "UPDATE transactions SET " . implode(', ', $installment_updates) . ", updated_at = NOW() WHERE id = ?";
                    $installment_stmt = $pdo->prepare($installment_sql);
                    $installment_stmt->execute($installment_values);
                }
            }
        }
        
        // Se for recorrente e o usuário quiser atualizar outras ocorrências abertas
        $update_recurrences = isset($data['update_recurrences']) ? (bool)$data['update_recurrences'] : false;
        
        // Log detalhado para debug
        error_log("=== Update Transaction Debug ===");
        error_log("Transaction ID: $transaction_id");
        error_log("Update recurrences param: " . (isset($data['update_recurrences']) ? var_export($data['update_recurrences'], true) : 'NOT SET'));
        error_log("Update recurrences (bool): " . ($update_recurrences ? 'true' : 'false'));
        error_log("Original recurrence_group_id: " . ($original_recurrence_group_id ?? 'NULL'));
        error_log("Original parent_recurrence_id: " . ($original_parent_recurrence_id ?? 'NULL'));
        error_log("Original is_recurring: " . ($original_is_recurring ? 'true' : 'false'));
        error_log("Transaction type: " . $transaction_data['type']);
        error_log("Transaction status: " . $transaction_data['status']);
        
        // Usar os dados originais que já foram buscados ANTES da atualização
        // Isso garante que temos os valores corretos de recurrence_group_id
        $recurrence_group_id = null;
        $transaction_type = $transaction_data['type'];
        
        // Tentar obter o recurrence_group_id usando os dados originais
        if ($original_recurrence_group_id) {
            // A transação tem recurrence_group_id diretamente (pai ou filha com grupo_id)
            $recurrence_group_id = $original_recurrence_group_id;
            error_log("Update recurrences: Found recurrence_group_id directly from original data: $recurrence_group_id");
        } else if ($original_parent_recurrence_id) {
            // É uma transação filha, buscar o grupo pelo pai
            error_log("Update recurrences: Transaction is a child, fetching from parent: $original_parent_recurrence_id");
            $stmt_parent = $pdo->prepare("SELECT recurrence_group_id, type FROM transactions WHERE id = ? AND family_id = ?");
            $stmt_parent->execute([$original_parent_recurrence_id, $family_id]);
            $parent_info = $stmt_parent->fetch();
            if ($parent_info && $parent_info['recurrence_group_id']) {
                $recurrence_group_id = $parent_info['recurrence_group_id'];
                $transaction_type = $parent_info['type'];
                error_log("Update recurrences: Found recurrence_group_id from parent: $recurrence_group_id");
            } else {
                error_log("Update recurrences: Parent transaction not found or has no recurrence_group_id. Parent ID: $original_parent_recurrence_id");
            }
        } else if ($original_is_recurring) {
            // É uma transação pai marcada como recorrente, mas não tem recurrence_group_id
            // Isso pode acontecer em dados antigos. Tentar buscar por transações similares do mesmo grupo
            error_log("Update recurrences: Transaction is marked as recurring but has no recurrence_group_id - may be old data");
            // Buscar por outras transações com mesma descrição e tipo que possam ter o grupo
            $stmt_find_group = $pdo->prepare("
                SELECT DISTINCT recurrence_group_id 
                FROM transactions 
                WHERE family_id = ? 
                AND type = ? 
                AND description = ? 
                AND recurrence_group_id IS NOT NULL
                AND (parent_recurrence_id = ? OR id = ?)
                LIMIT 1
            ");
            $stmt_find_group->execute([
                $family_id,
                $transaction_type,
                $transaction_data['description'],
                $transaction_id,
                $transaction_id
            ]);
            $found_group = $stmt_find_group->fetch();
            if ($found_group && $found_group['recurrence_group_id']) {
                $recurrence_group_id = $found_group['recurrence_group_id'];
                error_log("Update recurrences: Found recurrence_group_id by similarity: $recurrence_group_id");
            } else {
                error_log("Update recurrences: Could not find recurrence_group_id for recurring transaction $transaction_id");
            }
        }
        
        if ($update_recurrences && $recurrence_group_id) {
            error_log("Update recurrences: Starting update for group_id=$recurrence_group_id, type=$transaction_type, transaction_id=$transaction_id, family_id=$family_id");
            
            // Buscar a data da transação atual para filtrar apenas ocorrências futuras
            $stmt_current_date = $pdo->prepare("SELECT purchase_date, due_date FROM transactions WHERE id = ? AND family_id = ?");
            $stmt_current_date->execute([$transaction_id, $family_id]);
            $current_transaction_date = $stmt_current_date->fetch();
            $current_purchase_date = $current_transaction_date && $current_transaction_date['purchase_date'] ? $current_transaction_date['purchase_date'] : null;
            $current_due_date = $current_transaction_date && $current_transaction_date['due_date'] ? $current_transaction_date['due_date'] : null;
            $current_date = $current_due_date ? $current_due_date : $current_purchase_date;
            
            if (!$current_date) {
                error_log("Update recurrences: Could not find date for transaction $transaction_id");
                json_error('Erro ao buscar data da transação', 500);
            }
            
            // IMPORTANTE: Atualizar apenas ocorrências FUTURAS (due_date ou purchase_date >= data da transação atual)
            // e apenas as que estão PENDENTES (pending ou overdue)
            // Transações já pagas/recebidas não devem ser atualizadas
            // Para receitas e investimentos, status 'paid' não deve ser atualizado (já foi recebido/pago)
            // Para despesas, apenas 'pending' e 'overdue' devem ser atualizadas
            // Usar COALESCE(due_date, purchase_date) para comparar com a data de vencimento quando disponível
            if ($transaction_type === 'income' || $transaction_type === 'investment') {
                // Para receitas/investimentos: apenas 'pending' e 'overdue' (não 'paid', pois já foi recebido)
                $stmt = $pdo->prepare("
                    SELECT id, parent_recurrence_id, status, purchase_date, due_date
                    FROM transactions 
                    WHERE recurrence_group_id = ? 
                    AND id != ? 
                    AND COALESCE(due_date, purchase_date) >= ?
                    AND status IN ('pending', 'overdue')
                    AND family_id = ?
                    ORDER BY COALESCE(due_date, purchase_date) ASC
                ");
                $stmt->execute([$recurrence_group_id, $transaction_id, $current_date, $family_id]);
            } else {
                // Para despesas: apenas 'pending' e 'overdue'
                $stmt = $pdo->prepare("
                    SELECT id, parent_recurrence_id, status, purchase_date, due_date
                    FROM transactions 
                    WHERE recurrence_group_id = ? 
                    AND id != ? 
                    AND COALESCE(due_date, purchase_date) >= ?
                    AND status IN ('pending', 'overdue')
                    AND family_id = ?
                    ORDER BY COALESCE(due_date, purchase_date) ASC
                ");
                $stmt->execute([$recurrence_group_id, $transaction_id, $current_date, $family_id]);
            }
            
            $other_recurrences = $stmt->fetchAll();
            
            error_log("Update recurrences: Query executed with params: group_id=$recurrence_group_id, transaction_id=$transaction_id, family_id=$family_id");
            error_log("Update recurrences: Found " . count($other_recurrences) . " occurrences to update");
            
            // Log detalhado das ocorrências encontradas
            if (count($other_recurrences) > 0) {
                foreach ($other_recurrences as $idx => $occ) {
                    error_log("Update recurrences: Occurrence #" . ($idx + 1) . " - ID: {$occ['id']}, Status: {$occ['status']}, Parent: " . ($occ['parent_recurrence_id'] ?? 'NULL'));
                }
            } else {
                // Verificar quantas transações existem no grupo total (para debug)
                $stmt_total = $pdo->prepare("
                    SELECT COUNT(*) as total, 
                           SUM(CASE WHEN status IN ('pending', 'overdue') THEN 1 ELSE 0 END) as open_count,
                           SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count
                    FROM transactions 
                    WHERE recurrence_group_id = ? AND family_id = ?
                ");
                $stmt_total->execute([$recurrence_group_id, $family_id]);
                $total_info = $stmt_total->fetch();
                error_log("Update recurrences: Total transactions in group: " . ($total_info['total'] ?? 0) . ", Open: " . ($total_info['open_count'] ?? 0) . ", Paid: " . ($total_info['paid_count'] ?? 0));
            }
            
            if (count($other_recurrences) > 0) {
                // Campos que podem ser atualizados em todas as ocorrências
                // IMPORTANTE: incluir também o amount, pois para recorrências o valor é o mesmo em todas
                // (diferente de parcelas, onde cada parcela pode ter valor diferente)
                $fields_to_update = ['description', 'category_id', 'payment_method', 'credit_card_id', 'notes', 'amount'];
                
                // Buscar a data original da transação atual para calcular diferença de meses
                $stmt_current = $pdo->prepare("SELECT date, due_date FROM transactions WHERE id = ? AND family_id = ?");
                $stmt_current->execute([$transaction_id, $family_id]);
                $current_transaction = $stmt_current->fetch();
                
                // Base para cálculo de datas
                $base_due_date = null;
                $base_date = null;
                if (isset($data['due_date']) && $data['due_date']) {
                    $base_due_date = new DateTime($data['due_date']);
                } else if ($current_transaction && $current_transaction['due_date']) {
                    $base_due_date = new DateTime($current_transaction['due_date']);
                }
                
                if ($current_transaction && $current_transaction['date']) {
                    $base_date = new DateTime($current_transaction['date']);
                }
                
                $updated_count = 0;
                $update_details = [];
                
                // Buscar período de recorrência para calcular datas corretamente
                $stmt_period = $pdo->prepare("SELECT recurrence_period FROM transactions WHERE recurrence_group_id = ? AND parent_recurrence_id IS NULL AND family_id = ? LIMIT 1");
                $stmt_period->execute([$recurrence_group_id, $family_id]);
                $period_info = $stmt_period->fetch();
                $recurrence_period = $period_info['recurrence_period'] ?? 'monthly';
                
                // Atualizar cada ocorrência com os mesmos dados
                foreach ($other_recurrences as $recurrence) {
                    // Buscar data da ocorrência para calcular diferença
                    $stmt_occ_date = $pdo->prepare("SELECT date, due_date FROM transactions WHERE id = ? AND family_id = ?");
                    $stmt_occ_date->execute([$recurrence['id'], $family_id]);
                    $occ_transaction = $stmt_occ_date->fetch();
                    
                    $recurrence_updates = [];
                    $recurrence_values = [];
                    
                    // Calcular purchase_date para esta ocorrência baseado no período
                    if (isset($data['purchase_date']) && $data['purchase_date'] && $base_date && $occ_transaction) {
                        $base_purchase_date = new DateTime($data['purchase_date']);
                        $occ_date = new DateTime($occ_transaction['date']);
                        
                        // Calcular diferença de meses/semanas/dias entre a data base e a data da ocorrência
                        $diff = $base_date->diff($occ_date);
                        $months_diff = ($diff->y * 12) + $diff->m;
                        
                        // Ajustar purchase_date baseado no período de recorrência
                        $new_purchase_date = clone $base_purchase_date;
                        if ($recurrence_period === 'monthly' && $months_diff > 0) {
                            $new_purchase_date->modify("+$months_diff months");
                        } else if ($recurrence_period === 'yearly' && $diff->y > 0) {
                            $new_purchase_date->modify("+{$diff->y} years");
                        } else if ($recurrence_period === 'weekly' && $diff->days > 0) {
                            $weeks_diff = floor($diff->days / 7);
                            if ($weeks_diff > 0) {
                                $new_purchase_date->modify("+$weeks_diff weeks");
                            }
                        } else if ($recurrence_period === 'daily' && $diff->days > 0) {
                            $new_purchase_date->modify("+{$diff->days} days");
                        }
                        
                        $recurrence_updates[] = "purchase_date = ?";
                        $recurrence_values[] = $new_purchase_date->format('Y-m-d');
                    } else if (isset($data['purchase_date']) && $data['purchase_date']) {
                        // Fallback: usar a mesma data se não conseguir calcular
                        $recurrence_updates[] = "purchase_date = ?";
                        $recurrence_values[] = $data['purchase_date'];
                    }
                    
                    // Calcular due_date para esta ocorrência baseado no período
                    if (isset($data['due_date']) && $data['due_date'] && $base_due_date && $base_date && $occ_transaction) {
                        $occ_date = new DateTime($occ_transaction['date']);
                        
                        // Calcular diferença de meses/semanas/dias entre a data base e a data da ocorrência
                        $diff = $base_date->diff($occ_date);
                        $months_diff = ($diff->y * 12) + $diff->m;
                        
                        // Ajustar due_date baseado no período de recorrência
                        $new_due_date = clone $base_due_date;
                        if ($recurrence_period === 'monthly' && $months_diff > 0) {
                            $new_due_date->modify("+$months_diff months");
                        } else if ($recurrence_period === 'yearly' && $diff->y > 0) {
                            $new_due_date->modify("+{$diff->y} years");
                        } else if ($recurrence_period === 'weekly' && $diff->days > 0) {
                            $weeks_diff = floor($diff->days / 7);
                            if ($weeks_diff > 0) {
                                $new_due_date->modify("+$weeks_diff weeks");
                            }
                        } else if ($recurrence_period === 'daily' && $diff->days > 0) {
                            $new_due_date->modify("+{$diff->days} days");
                        }
                        
                        $recurrence_updates[] = "due_date = ?";
                        $recurrence_values[] = $new_due_date->format('Y-m-d');
                    } else if (isset($data['due_date']) && $data['due_date']) {
                        // Fallback: usar a mesma data se não conseguir calcular
                        $recurrence_updates[] = "due_date = ?";
                        $recurrence_values[] = $data['due_date'];
                    }
                    
                    // Atualizar outros campos (incluindo amount, se fornecido)
                    foreach ($fields_to_update as $field) {
                        if (isset($data[$field])) {
                            $recurrence_updates[] = "$field = ?";
                            $recurrence_values[] = $data[$field];
                        }
                    }
                    
                    if (!empty($recurrence_updates)) {
                        $recurrence_values[] = $recurrence['id'];
                        $recurrence_sql = "UPDATE transactions SET " . implode(', ', $recurrence_updates) . ", updated_at = NOW() WHERE id = ? AND family_id = ?";
                        $recurrence_values[] = $family_id; // Adicionar family_id para segurança
                        $recurrence_stmt = $pdo->prepare($recurrence_sql);
                        $result = $recurrence_stmt->execute($recurrence_values);
                        $rows_affected = $recurrence_stmt->rowCount();
                        
                        if ($result && $rows_affected > 0) {
                            $updated_count++;
                            $update_details[] = "ID: {$recurrence['id']}, Status: {$recurrence['status']}, Rows: $rows_affected";
                            error_log("Update recurrences: Successfully updated occurrence {$recurrence['id']} (status: {$recurrence['status']}, rows affected: $rows_affected)");
                        } else {
                            error_log("Update recurrences: Failed to update occurrence {$recurrence['id']} (result: " . ($result ? 'true' : 'false') . ", rows: $rows_affected)");
                        }
                    } else {
                        error_log("Update recurrences: No fields to update for occurrence {$recurrence['id']}");
                    }
                }
                
                error_log("Update recurrences: Successfully updated $updated_count of " . count($other_recurrences) . " occurrences. Details: " . implode('; ', $update_details));
            } else {
                // Verificar se existem ocorrências com status diferente (para debug)
                $stmt_debug = $pdo->prepare("
                    SELECT id, status, parent_recurrence_id 
                    FROM transactions 
                    WHERE recurrence_group_id = ? 
                    AND family_id = ?
                    ORDER BY status
                ");
                $stmt_debug->execute([$recurrence_group_id, $family_id]);
                $all_occurrences = $stmt_debug->fetchAll();
                $status_breakdown = [];
                foreach ($all_occurrences as $occ) {
                    $status = $occ['status'] ?? 'NULL';
                    $status_breakdown[$status] = ($status_breakdown[$status] ?? 0) + 1;
                }
                error_log("Update recurrences: No occurrences found to update. Total in group: " . count($all_occurrences) . ", Status breakdown: " . json_encode($status_breakdown));
            }
        } else {
            if ($update_recurrences) {
                error_log("Update recurrences: update_recurrences=true but recurrence_group_id is null. Original data: recurrence_group_id=" . ($original_recurrence_group_id ?? 'NULL') . ", parent_recurrence_id=" . ($original_parent_recurrence_id ?? 'NULL') . ", is_recurring=" . ($original_is_recurring ? 'true' : 'false'));
            }
        }
        
        $pdo->commit();
        
        // Buscar transação atualizada com relacionamentos
        $stmt = $pdo->prepare("
            SELECT 
                t.*,
                c.id as category_id_full,
                c.name as category_name,
                c.icon as category_icon,
                c.color as category_color,
                cc.id as credit_card_id_full,
                cc.name as credit_card_name,
                cc.brand as credit_card_brand
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
            WHERE t.id = ?
        ");
        $stmt->execute([$transaction_id]);
        $transaction = $stmt->fetch();
        
        if (!$transaction) {
            json_error('Transação não encontrada após atualização', 404);
        }
        
        // Formatar resposta similar ao list
        $formatted = [
            'id' => $transaction['id'],
            'type' => $transaction['type'],
            'description' => $transaction['description'],
            'amount' => (float)$transaction['amount'],
            'date' => $transaction['date'],
            'category_id' => $transaction['category_id'],
            'user_id' => $transaction['user_id'],
            'family_id' => $transaction['family_id'],
            'payment_method' => $transaction['payment_method'],
            'credit_card_id' => $transaction['credit_card_id'],
            'is_installment' => (bool)$transaction['is_installment'],
            'total_installments' => $transaction['total_installments'] ? (int)$transaction['total_installments'] : null,
            'current_installment' => $transaction['current_installment'] ? (int)$transaction['current_installment'] : null,
            'installment_group_id' => $transaction['installment_group_id'],
            'is_recurring' => (bool)$transaction['is_recurring'],
            'recurrence_period' => $transaction['recurrence_period'],
            'recurrence_end_date' => $transaction['recurrence_end_date'],
            'recurrence_group_id' => $transaction['recurrence_group_id'],
            'parent_recurrence_id' => $transaction['parent_recurrence_id'],
            'notes' => $transaction['notes'],
            'attachment_url' => $transaction['attachment_url'],
            'created_at' => $transaction['created_at'],
            'updated_at' => $transaction['updated_at'],
            'categories' => $transaction['category_id'] ? [
                'id' => $transaction['category_id_full'],
                'name' => $transaction['category_name'],
                'icon' => $transaction['category_icon'],
                'color' => $transaction['category_color'],
            ] : null,
            'credit_cards' => $transaction['credit_card_id'] ? [
                'id' => $transaction['credit_card_id_full'],
                'name' => $transaction['credit_card_name'],
                'brand' => $transaction['credit_card_brand'],
            ] : null,
        ];
        
        json_response(['transaction' => $formatted]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao atualizar transação: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        json_error('Erro ao atualizar transação: ' . $e->getMessage(), 500);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao atualizar transação: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        json_error('Erro ao atualizar transação: ' . $e->getMessage(), 500);
    }
}

function handleDeleteTransaction() {
    global $pdo, $user_id;
    
    // Tentar obter ID de query string, POST ou body JSON
    $transaction_id = $_GET['id'] ?? $_POST['id'] ?? null;
    $data = get_request_body();
    
    // Se não encontrou no GET/POST, tentar no body JSON
    if (!$transaction_id && isset($data['id'])) {
        $transaction_id = $data['id'];
    }
    
    if (!$transaction_id) {
        json_error('ID da transação não fornecido', 400);
    }
    
    $family_id = getFamilyId();
    if (!$family_id) {
        json_error('Família não encontrada', 403);
    }
    
    $delete_all_open = isset($data['delete_all_open']) && $data['delete_all_open'] === true;
    $delete_all_recurrences = isset($data['delete_all_recurrences']) && $data['delete_all_recurrences'] === true;
    
    // Verificar se a transação pertence ao usuário/família e seu status
    $stmt = $pdo->prepare("SELECT id, installment_group_id, recurrence_group_id, parent_recurrence_id, status FROM transactions WHERE id = ? AND family_id = ?");
    $stmt->execute([$transaction_id, $family_id]);
    $transaction = $stmt->fetch();
    
    if (!$transaction) {
        json_error('Transação não encontrada', 404);
    }
    
    // Não permitir exclusão de transações já pagas/recebidas
    if ($transaction['status'] === 'paid') {
        json_error('Não é possível excluir transações já pagas/recebidas. Apenas transações pendentes podem ser excluídas.', 400);
    }
    
    $installment_group_id = $transaction['installment_group_id'];
    $recurrence_group_id = $transaction['recurrence_group_id'];
    $parent_recurrence_id = $transaction['parent_recurrence_id'];
    $transaction_status = $transaction['status'];
    
    // Se for uma transação filha de recorrência, buscar o grupo pelo pai
    if ($parent_recurrence_id && !$recurrence_group_id) {
        $stmt_parent = $pdo->prepare("SELECT recurrence_group_id FROM transactions WHERE id = ? AND family_id = ?");
        $stmt_parent->execute([$parent_recurrence_id, $family_id]);
        $parent_info = $stmt_parent->fetch();
        if ($parent_info && $parent_info['recurrence_group_id']) {
            $recurrence_group_id = $parent_info['recurrence_group_id'];
        }
    }
    
    try {
        $pdo->beginTransaction();
        
        $deleted_count = 0;
        $deleted_messages = [];
        $transaction_already_deleted = false;
        
        // Excluir parcelas abertas se solicitado
        if ($delete_all_open && $installment_group_id) {
            // Excluir todas as parcelas abertas (pendentes ou em atraso) do mesmo grupo, incluindo a selecionada
            $stmt = $pdo->prepare("
                DELETE FROM transactions 
                WHERE installment_group_id = ? 
                AND status IN ('pending', 'overdue')
                AND family_id = ?
            ");
            $stmt->execute([$installment_group_id, $family_id]);
            $installment_count = $stmt->rowCount();
            $deleted_count += $installment_count;
            
            // Verificar se a transação selecionada foi excluída
            if ($transaction_status === 'pending' || $transaction_status === 'overdue') {
                $transaction_already_deleted = true;
            }
            
            if ($installment_count > 0) {
                $deleted_messages[] = "$installment_count parcela(s) excluída(s)";
            }
        }
        
        // Excluir recorrências abertas se solicitado
        if ($delete_all_recurrences && $recurrence_group_id) {
            // Excluir todas as ocorrências abertas (pendentes ou em atraso) do mesmo grupo
            // Usar NOT IN para evitar excluir novamente as parcelas já excluídas acima
            if ($transaction_already_deleted) {
                // Se a transação já foi excluída, excluir apenas as outras ocorrências
                $stmt = $pdo->prepare("
                    DELETE FROM transactions 
                    WHERE recurrence_group_id = ? 
                    AND status IN ('pending', 'overdue')
                    AND id != ?
                    AND family_id = ?
                ");
                $stmt->execute([$recurrence_group_id, $transaction_id, $family_id]);
            } else {
                // Excluir todas as ocorrências abertas, incluindo a selecionada
                $stmt = $pdo->prepare("
                    DELETE FROM transactions 
                    WHERE recurrence_group_id = ? 
                    AND status IN ('pending', 'overdue')
                    AND family_id = ?
                ");
                $stmt->execute([$recurrence_group_id, $family_id]);
                
                // Verificar se a transação selecionada foi excluída
                if ($transaction_status === 'pending' || $transaction_status === 'overdue') {
                    $transaction_already_deleted = true;
                }
            }
            
            $recurrence_count = $stmt->rowCount();
            $deleted_count += $recurrence_count;
            
            if ($recurrence_count > 0) {
                $deleted_messages[] = "$recurrence_count ocorrência(s) excluída(s)";
            }
        }
        
        // Se a transação selecionada não foi excluída (porque estava paga ou cancelada), excluí-la separadamente
        if (!$transaction_already_deleted && ($delete_all_open || $delete_all_recurrences)) {
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND family_id = ?");
            $stmt->execute([$transaction_id, $family_id]);
            $single_count = $stmt->rowCount();
            $deleted_count += $single_count;
            if ($single_count > 0) {
                $deleted_messages[] = "Transação selecionada excluída";
            }
        }
        
        // Se excluiu parcelas ou recorrências, fazer commit e retornar
        if ($deleted_count > 0) {
            $pdo->commit();
            $message = $deleted_count > 1 
                ? "$deleted_count transações excluídas (" . implode(', ', $deleted_messages) . ")"
                : ($deleted_messages[0] ?? 'Transação excluída');
            json_response(['message' => $message]);
        } else if ($delete_all_open || $delete_all_recurrences) {
            // Se foi solicitado excluir todas mas nenhuma foi encontrada, excluir apenas a selecionada
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND family_id = ?");
            $stmt->execute([$transaction_id, $family_id]);
            $deleted_count = $stmt->rowCount();
            
            if ($deleted_count > 0) {
                $pdo->commit();
                json_response(['message' => 'Transação excluída']);
            } else {
                $pdo->rollBack();
                json_error('Nenhuma transação foi excluída', 400);
            }
        } else {
            // Excluir apenas a transação selecionada
            // Primeiro verificar se realmente existe antes de tentar excluir
            $check_stmt = $pdo->prepare("SELECT id FROM transactions WHERE id = ? AND family_id = ?");
            $check_stmt->execute([$transaction_id, $family_id]);
            $exists = $check_stmt->fetch();
            
            if (!$exists) {
                $pdo->rollBack();
                json_error('Transação não encontrada ou não pertence à sua família', 404);
            }
            
            // Agora excluir
            $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ? AND family_id = ?");
            $result = $stmt->execute([$transaction_id, $family_id]);
            $deleted_count = $stmt->rowCount();
            
            // Verificar se realmente excluiu (alguns drivers PDO podem ter problemas com rowCount)
            if ($deleted_count > 0 || $result) {
                $pdo->commit();
                
                // Verificar se realmente foi excluído após commit
                $verify_stmt = $pdo->prepare("SELECT COUNT(*) as count FROM transactions WHERE id = ? AND family_id = ?");
                $verify_stmt->execute([$transaction_id, $family_id]);
                $verify = $verify_stmt->fetch();
                
                if ($verify['count'] == 0) {
                    json_response(['message' => 'Transação excluída']);
                } else {
                    error_log("Erro: Transação ainda existe após exclusão. ID=$transaction_id, Family=$family_id");
                    json_error('Erro ao excluir transação. Tente novamente.', 500);
                }
            } else {
                $pdo->rollBack();
                error_log("Falha ao excluir: ID=$transaction_id, Family=$family_id, RowCount=$deleted_count, Result=" . ($result ? 'true' : 'false'));
                json_error('Transação não foi excluída. Verifique se ela existe e pertence à sua família.', 400);
            }
        }
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao excluir transação: " . $e->getMessage());
        json_error('Erro ao excluir transação: ' . $e->getMessage(), 500);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Erro ao excluir transação: " . $e->getMessage());
        json_error('Erro ao excluir transação: ' . $e->getMessage(), 500);
    }
}

function handleGetDashboardSummary() {
    global $pdo, $user_id;
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['summary' => ['income' => 0, 'expense' => 0, 'investment' => 0]]);
        return;
    }

    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
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

    try {
        $sql = "
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
                SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as investment,
                SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END) as expense_pending,
                SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END) as income_pending
            FROM transactions
            WHERE family_id = ?
            AND status != 'cancelled'
        ";
        $params = [$family_id];
        
        if ($targetUserId) {
            $sql .= " AND user_id = ?";
            $params[] = $targetUserId;
        }

        if ($startDate) {
            // Usar due_date para filtrar (data de vencimento/recebimento)
            // Se não houver due_date, usar purchase_date como fallback
            $sql .= " AND COALESCE(due_date, purchase_date) >= ?";
            $params[] = $startDate;
        }
        if ($endDate) {
            // Usar due_date para filtrar (data de vencimento/recebimento)
            // Se não houver due_date, usar purchase_date como fallback
            $sql .= " AND COALESCE(due_date, purchase_date) <= ?";
            $params[] = $endDate;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $summary = $stmt->fetch();

        json_response(['summary' => [
            'income' => (float)($summary['income'] ?? 0),
            'expense' => (float)($summary['expense'] ?? 0),
            'investment' => (float)($summary['investment'] ?? 0),
            'expense_pending' => (float)($summary['expense_pending'] ?? 0),
            'income_pending' => (float)($summary['income_pending'] ?? 0),
        ]]);

    } catch (PDOException $e) {
        error_log("Erro ao buscar resumo do dashboard: " . $e->getMessage());
        json_error('Erro ao buscar resumo do dashboard', 500);
    }
}

function handleGetMonthlyTrends() {
    global $pdo, $user_id;
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['trends' => []]);
        return;
    }

    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
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

    try {
        $sql = "
            SELECT
                YEAR(COALESCE(due_date, purchase_date)) as year,
                MONTH(COALESCE(due_date, purchase_date)) as month,
                type,
                SUM(amount) as total_amount
            FROM transactions
            WHERE family_id = ?
            AND status != 'cancelled'
        ";
        $params = [$family_id];
        
        if ($targetUserId) {
            $sql .= " AND user_id = ?";
            $params[] = $targetUserId;
        }

        if ($startDate) {
            $sql .= " AND COALESCE(due_date, purchase_date) >= ?";
            $params[] = $startDate;
        }
        if ($endDate) {
            $sql .= " AND COALESCE(due_date, purchase_date) <= ?";
            $params[] = $endDate;
        }

        $sql .= "
            GROUP BY YEAR(COALESCE(due_date, purchase_date)), MONTH(COALESCE(due_date, purchase_date)), type
            ORDER BY year ASC, month ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $trends = $stmt->fetchAll();

        json_response(['trends' => $trends]);

    } catch (PDOException $e) {
        error_log("Erro ao buscar tendências mensais: " . $e->getMessage());
        json_error('Erro ao buscar tendências mensais', 500);
    }
}

function handleGetExpensesByCategory() {
    global $pdo, $user_id;
    $family_id = getFamilyId();
    if (!$family_id) {
        json_response(['expenses' => []]);
        return;
    }

    $startDate = $_GET['startDate'] ?? null;
    $endDate = $_GET['endDate'] ?? null;
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

    try {
        // Sempre passar startDate e endDate (usar valores padrão se não fornecidos)
        if (!$startDate) {
            $startDate = date('Y-m-01'); // Primeiro dia do mês atual
        }
        if (!$endDate) {
            $endDate = date('Y-m-t'); // Último dia do mês atual
        }

        $sql = "
            SELECT
                COALESCE(c.id, '') as category_id,
                COALESCE(c.name, 'Sem categoria') as category_name,
                COALESCE(c.color, '#6b7280') as category_color,
                SUM(t.amount) as total_amount
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.family_id = ? 
            AND t.type = 'expense'
            AND t.status != 'cancelled'
            AND COALESCE(t.due_date, t.purchase_date) >= ?
            AND COALESCE(t.due_date, t.purchase_date) <= ?
        ";
        
        $params = [
            $family_id,
            $startDate,
            $endDate,
        ];
        
        if ($targetUserId) {
            $sql .= " AND t.user_id = ?";
            $params[] = $targetUserId;
        }
        
        $sql .= "
            GROUP BY c.id, c.name, c.color
            HAVING SUM(t.amount) > 0
            ORDER BY total_amount DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        json_response(['expenses' => $expenses]);

    } catch (PDOException $e) {
        error_log("Erro ao buscar despesas por categoria: " . $e->getMessage());
        json_error('Erro ao buscar despesas por categoria', 500);
    }
}

/**
 * Gera transações recorrentes futuras baseadas na transação pai
 */
function generateRecurringTransactions($pdo, $parent_id, $recurrence_group_id, $parent_data, $user_id, $family_id, $period, $end_date) {
    $base_date = new DateTime($parent_data['date']);
    $base_purchase_date = isset($parent_data['purchase_date']) && $parent_data['purchase_date'] 
        ? new DateTime($parent_data['purchase_date']) 
        : clone $base_date;
    $base_due_date = isset($parent_data['due_date']) && $parent_data['due_date'] 
        ? new DateTime($parent_data['due_date']) 
        : null;
    
    $end_date_obj = $end_date ? new DateTime($end_date) : null;
    
    // Limite máximo: 24 meses à frente ou até a data final
    $max_date = new DateTime();
    $max_date->modify('+24 months');
    
    if ($end_date_obj && $end_date_obj < $max_date) {
        $max_date = $end_date_obj;
    }
    
    $current_date = clone $base_date;
    $current_purchase_date = clone $base_purchase_date;
    $current_due_date = $base_due_date ? clone $base_due_date : null;
    
    $count = 0;
    $max_occurrences = 24; // Limite de segurança
    
    while ($current_date <= $max_date && $count < $max_occurrences) {
        // Avançar data baseado no período
        switch ($period) {
            case 'daily':
                $current_date->modify('+1 day');
                $current_purchase_date->modify('+1 day');
                if ($current_due_date) {
                    $current_due_date->modify('+1 day');
                }
                break;
            case 'weekly':
                $current_date->modify('+1 week');
                $current_purchase_date->modify('+1 week');
                if ($current_due_date) {
                    $current_due_date->modify('+1 week');
                }
                break;
            case 'monthly':
                $current_date->modify('+1 month');
                $current_purchase_date->modify('+1 month');
                if ($current_due_date) {
                    $current_due_date->modify('+1 month');
                }
                break;
            case 'yearly':
                $current_date->modify('+1 year');
                $current_purchase_date->modify('+1 year');
                if ($current_due_date) {
                    $current_due_date->modify('+1 year');
                }
                break;
        }
        
        // Se passou da data final, parar
        if ($end_date_obj && $current_date > $end_date_obj) {
            break;
        }
        
        // Se passou do limite de 24 meses, parar
        if ($current_date > $max_date) {
            break;
        }
        
        // Verificar se já existe uma transação para esta data
        $check_stmt = $pdo->prepare("
            SELECT id FROM transactions 
            WHERE recurrence_group_id = ? 
            AND date = ? 
            AND family_id = ?
        ");
        $check_stmt->execute([$recurrence_group_id, $current_date->format('Y-m-d'), $family_id]);
        
        if (!$check_stmt->fetch()) {
            // Criar nova transação recorrente
            $child_id = generate_uuid();
            // Status padrão para transações filhas: todas começam como 'pending'
            // O usuário deve marcar manualmente como 'paid' quando receber/pagar
            $child_status = 'pending';
            
            $stmt = $pdo->prepare("
                INSERT INTO transactions (
                    id, type, description, amount, date, purchase_date, due_date, category_id, user_id, family_id,
                    payment_method, status, credit_card_id, is_installment, total_installments,
                    current_installment, installment_group_id, is_recurring, recurrence_period,
                    recurrence_end_date, recurrence_group_id, parent_recurrence_id, notes, attachment_url,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $child_id,
                $parent_data['type'],
                $parent_data['description'],
                $parent_data['amount'],
                $current_date->format('Y-m-d'),
                $current_purchase_date->format('Y-m-d'),
                $current_due_date ? $current_due_date->format('Y-m-d') : null,
                $parent_data['category_id'] ?? null,
                $user_id,
                $family_id,
                $parent_data['payment_method'],
                $child_status,
                $parent_data['credit_card_id'] ?? null,
                false, // Não é parcela
                null,
                null,
                null,
                0, // Transações filhas não são marcadas como recorrentes
                $period,
                $end_date,
                $recurrence_group_id,
                $parent_id, // Referência ao pai
                $parent_data['notes'] ?? null,
                $parent_data['attachment_url'] ?? null,
            ]);
        }
        
        $count++;
    }
}

/**
 * Verifica e gera transações recorrentes que estão faltando
 */
function ensureRecurringTransactions($pdo, $family_id, $start_date, $end_date) {
    // Buscar todas as transações recorrentes ativas (pais)
    $stmt = $pdo->prepare("
        SELECT * FROM transactions 
        WHERE family_id = ? 
        AND is_recurring = 1 
        AND parent_recurrence_id IS NULL
        AND (recurrence_end_date IS NULL OR recurrence_end_date >= ?)
    ");
    $stmt->execute([$family_id, $start_date]);
    $recurring_parents = $stmt->fetchAll();
    
    foreach ($recurring_parents as $parent) {
        $recurrence_group_id = $parent['recurrence_group_id'];
        $period = $parent['recurrence_period'];
        $end_date_obj = $parent['recurrence_end_date'] ? new DateTime($parent['recurrence_end_date']) : null;
        
        // Buscar última transação gerada deste grupo (usar due_date ou purchase_date)
        $last_stmt = $pdo->prepare("
            SELECT MAX(COALESCE(due_date, purchase_date)) as last_date FROM transactions 
            WHERE recurrence_group_id = ? AND family_id = ?
        ");
        $last_stmt->execute([$recurrence_group_id, $family_id]);
        $last_result = $last_stmt->fetch();
        $parent_date = $parent['due_date'] ? $parent['due_date'] : ($parent['purchase_date'] ? $parent['purchase_date'] : null);
        $last_date = $last_result['last_date'] ? new DateTime($last_result['last_date']) : ($parent_date ? new DateTime($parent_date) : new DateTime());
        
        // Gerar transações até a data final solicitada
        $target_date = new DateTime($end_date);
        $current_date = clone $last_date;
        
        while ($current_date < $target_date) {
            // Avançar data baseado no período
            switch ($period) {
                case 'daily':
                    $current_date->modify('+1 day');
                    break;
                case 'weekly':
                    $current_date->modify('+1 week');
                    break;
                case 'monthly':
                    $current_date->modify('+1 month');
                    break;
                case 'yearly':
                    $current_date->modify('+1 year');
                    break;
            }
            
            // Se passou da data final da recorrência, parar
            if ($end_date_obj && $current_date > $end_date_obj) {
                break;
            }
            
            // Se passou da data solicitada, parar
            if ($current_date > $target_date) {
                break;
            }
            
            // Verificar se já existe (verificar por due_date ou purchase_date)
            $check_stmt = $pdo->prepare("
                SELECT id FROM transactions 
                WHERE recurrence_group_id = ? 
                AND (due_date = ? OR purchase_date = ?)
                AND family_id = ?
            ");
            $check_stmt->execute([$recurrence_group_id, $current_date->format('Y-m-d'), $current_date->format('Y-m-d'), $family_id]);
            
            if (!$check_stmt->fetch()) {
                // Criar nova transação
                $child_id = generate_uuid();
                // Para transações recorrentes, purchase_date e due_date são calculados baseados no período
                // purchase_date = data da ocorrência (current_date)
                // due_date = data da ocorrência (current_date) - pode ser ajustado depois se necessário
                $purchase_date = $current_date->format('Y-m-d');
                $due_date = $current_date->format('Y-m-d');
                
                $insert_stmt = $pdo->prepare("
                    INSERT INTO transactions (
                        id, type, description, amount, date, purchase_date, due_date, category_id, user_id, family_id,
                        payment_method, status, credit_card_id, is_installment, total_installments,
                        current_installment, installment_group_id, is_recurring, recurrence_period,
                        recurrence_end_date, recurrence_group_id, parent_recurrence_id, notes, attachment_url,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                // Status padrão para transações filhas: todas começam como 'pending'
                // O usuário deve marcar manualmente como 'paid' quando receber/pagar
                $child_status = 'pending';
                
                // date será preenchido com purchase_date para compatibilidade
                $insert_stmt->execute([
                    $child_id,
                    $parent['type'],
                    $parent['description'],
                    $parent['amount'],
                    $purchase_date, // date = purchase_date para compatibilidade
                    $purchase_date,
                    $due_date,
                    $parent['category_id'],
                    $parent['user_id'],
                    $family_id,
                    $parent['payment_method'],
                    $child_status,
                    $parent['credit_card_id'],
                    false,
                    null,
                    null,
                    null,
                    0,
                    $period,
                    $parent['recurrence_end_date'],
                    $recurrence_group_id,
                    $parent['id'],
                    $parent['notes'],
                    $parent['attachment_url'],
                ]);
            }
        }
    }
}

