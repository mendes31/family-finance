-- ============================================
-- Migration 022: Create email_settings table
-- Descrição: Cria a tabela de configurações de e-mail SMTP
-- Data: 2026-01-10
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS email_settings (
  id CHAR(36) PRIMARY KEY,
  family_id CHAR(36) NOT NULL,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_user VARCHAR(255) NOT NULL,
  smtp_password VARCHAR(255) NOT NULL, -- Criptografado
  smtp_port INT NOT NULL DEFAULT 587,
  smtp_encryption ENUM('none', 'tls', 'ssl') NOT NULL DEFAULT 'tls',
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  UNIQUE KEY unique_family_email (family_id),
  INDEX idx_family_id (family_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




