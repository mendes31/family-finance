-- ============================================
-- Migration 002: Create families table
-- Descrição: Cria a tabela de famílias
-- Data: 2026-01-05
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS families (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

