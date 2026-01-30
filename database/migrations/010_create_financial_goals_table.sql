-- ============================================
-- Migration 010: Create financial_goals table
-- Descrição: Cria a tabela de metas financeiras
-- Data: 2026-01-05
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS financial_goals (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  family_id CHAR(36) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_family_id (family_id),
  INDEX idx_is_completed (is_completed),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

