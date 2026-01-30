-- ============================================
-- Migration 015: Add recurrence fields to transactions
-- Descrição: Adiciona campos de recorrência para transações
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Adicionar campos de recorrência
ALTER TABLE transactions
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE AFTER is_installment,
ADD COLUMN recurrence_period ENUM('daily', 'weekly', 'monthly', 'yearly') NULL AFTER is_recurring,
ADD COLUMN recurrence_end_date DATE NULL AFTER recurrence_period,
ADD COLUMN recurrence_group_id CHAR(36) NULL AFTER recurrence_end_date,
ADD COLUMN parent_recurrence_id CHAR(36) NULL AFTER recurrence_group_id,
ADD INDEX idx_is_recurring (is_recurring),
ADD INDEX idx_recurrence_group_id (recurrence_group_id),
ADD INDEX idx_parent_recurrence_id (parent_recurrence_id),
ADD INDEX idx_recurrence_end_date (recurrence_end_date);

-- Adicionar foreign key para parent_recurrence_id (auto-referência)
ALTER TABLE transactions
ADD CONSTRAINT fk_parent_recurrence
FOREIGN KEY (parent_recurrence_id) REFERENCES transactions(id) ON DELETE SET NULL;

