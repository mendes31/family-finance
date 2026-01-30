-- ============================================
-- Migration 018: Add purchase_date to transactions
-- Descrição: Adiciona campo purchase_date (data da compra) para diferenciar da data do lançamento
-- Data: 2026-01-15
-- ============================================

USE family_finance;

ALTER TABLE transactions
ADD COLUMN purchase_date DATE NULL AFTER date,
ADD INDEX idx_purchase_date (purchase_date);

-- Atualizar purchase_date com o valor de date para transações existentes
UPDATE transactions 
SET purchase_date = date 
WHERE purchase_date IS NULL;

