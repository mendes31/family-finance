-- ============================================
-- Migration 006: Create categories table
-- Descrição: Cria a tabela de categorias de transações
-- Data: 2026-01-05
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('income', 'expense', 'investment') NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  family_id CHAR(36),
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_family_id (family_id),
  INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

