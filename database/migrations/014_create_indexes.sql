-- ============================================
-- Migration 014: Create additional indexes
-- Descrição: Cria índices adicionais para performance
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Índices compostos para queries frequentes
-- MySQL não suporta IF NOT EXISTS em CREATE INDEX, então verificamos antes
CREATE INDEX idx_transactions_family_date ON transactions(family_id, date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_type_date ON transactions(type, date);
CREATE INDEX idx_budgets_family_month_year ON budgets(family_id, month, year);
CREATE INDEX idx_alerts_user_read ON alerts(user_id, is_read);

