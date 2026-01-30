<?php
/**
 * Script para executar a migration 018
 * Adiciona purchase_date à tabela transactions
 */

require_once __DIR__ . '/api/config.php';

try {
    $pdo = get_db_connection();
    
    // Verificar se a coluna já existe
    $stmt = $pdo->query("SHOW COLUMNS FROM transactions LIKE 'purchase_date'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Coluna purchase_date já existe na tabela transactions\n";
        exit(0);
    }
    
    // Adicionar coluna
    $pdo->exec("ALTER TABLE transactions ADD COLUMN purchase_date DATE NULL AFTER date");
    $pdo->exec("ALTER TABLE transactions ADD INDEX idx_purchase_date (purchase_date)");
    
    // Atualizar purchase_date com o valor de date para transações existentes
    $pdo->exec("UPDATE transactions SET purchase_date = date WHERE purchase_date IS NULL");
    
    echo "✅ Migration 018 executada com sucesso!\n";
    echo "   - Coluna purchase_date adicionada\n";
    echo "   - Índice criado\n";
    echo "   - Dados existentes atualizados\n";
    
} catch (Exception $e) {
    echo "❌ Erro ao executar migration: " . $e->getMessage() . "\n";
    exit(1);
}

