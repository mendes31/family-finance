-- ============================================
-- Migration 026: Create WhatsApp Settings Table
-- Descrição: Cria tabela para armazenar configurações de integração WhatsApp
-- Data: 2026-01-XX
-- ============================================

USE family_finance;

-- Criar tabela whatsapp_settings
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id CHAR(36) PRIMARY KEY,
    family_id CHAR(36) NOT NULL,
    provider ENUM('evolution', 'twilio', 'meta') NOT NULL DEFAULT 'evolution',
    api_url VARCHAR(500) NULL,
    api_key TEXT NOT NULL COMMENT 'Criptografado',
    api_token TEXT NULL COMMENT 'Criptografado (apenas Twilio e Meta)',
    instance_name VARCHAR(100) NOT NULL DEFAULT 'WhatsApp',
    whatsapp_number VARCHAR(20) NOT NULL COMMENT 'Número com DDI, apenas dígitos',
    webhook_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    UNIQUE KEY unique_family_id (family_id),
    INDEX idx_family_id (family_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

