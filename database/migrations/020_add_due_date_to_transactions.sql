-- ============================================
-- Migration 020: Add due_date to transactions
-- Descrição: Adiciona campo due_date (data de vencimento) para transações
-- Data: 2026-01-15
-- ============================================

USE family_finance;

ALTER TABLE transactions
ADD COLUMN due_date DATE NULL AFTER purchase_date,
ADD INDEX idx_due_date (due_date);

