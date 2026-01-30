-- ============================================
-- Migration 011: Create alerts table
-- Descrição: Cria a tabela de alertas e notificações
-- Data: 2026-01-05
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS alerts (
  id CHAR(36) PRIMARY KEY,
  type ENUM('due_date', 'budget_exceeded', 'goal_progress', 'installment') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  channel ENUM('app', 'whatsapp', 'email') NOT NULL DEFAULT 'app',
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for DATETIME,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_scheduled_for (scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

