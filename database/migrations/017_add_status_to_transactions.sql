-- ============================================
-- Migration 017: Add status field to transactions
-- Descrição: Adiciona campo de status para transações (aberta, paga, vencida, cancelada)
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Adicionar campo de status
ALTER TABLE transactions
ADD COLUMN status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending' AFTER payment_method,
ADD INDEX idx_status (status);

-- Atualizar transações existentes: receitas e investimentos como 'paid', despesas como 'pending'
UPDATE transactions 
SET status = CASE 
  WHEN type IN ('income', 'investment') THEN 'paid'
  ELSE 'pending'
END
WHERE status IS NULL;

