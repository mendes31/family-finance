-- ============================================
-- Migration 007: Create credit_cards table
-- Descrição: Cria a tabela de cartões de crédito
-- Data: 2026-01-05
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS credit_cards (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  holder_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_day TINYINT NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day TINYINT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (holder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_holder_id (holder_id),
  INDEX idx_family_id (family_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

