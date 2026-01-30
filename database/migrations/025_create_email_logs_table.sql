-- ============================================
-- Migration 025: Create email_logs table
-- Descrição: Cria a tabela de histórico de e-mails enviados
-- Data: 2026-01-10
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS email_logs (
  id CHAR(36) PRIMARY KEY,
  family_id CHAR(36) NOT NULL,
  email_type ENUM('invitation', 'test', 'notification') NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSON,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_family_id (family_id),
  INDEX idx_recipient_email (recipient_email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_email_type (email_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


