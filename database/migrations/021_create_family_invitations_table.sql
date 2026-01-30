-- ============================================
-- Migration 021: Create family_invitations table
-- Descrição: Cria a tabela de convites para membros da família
-- Data: 2026-01-10
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS family_invitations (
  id CHAR(36) PRIMARY KEY,
  family_id CHAR(36) NOT NULL,
  invited_by CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  invitation_type ENUM('pre_register', 'full_register') NOT NULL DEFAULT 'pre_register',
  -- pre_register: apenas email e nome, usuário completa depois
  -- full_register: cadastro completo com senha gerada
  token CHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL, -- Apenas para full_register
  status ENUM('pending', 'accepted', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_family_id (family_id),
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




