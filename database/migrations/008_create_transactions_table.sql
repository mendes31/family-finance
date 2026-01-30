-- ============================================
-- Migration 008: Create transactions table
-- Descrição: Cria a tabela de transações financeiras
-- Data: 2026-01-05
-- ============================================

USE family_finance;

CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) PRIMARY KEY,
  type ENUM('income', 'expense', 'investment') NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  category_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  payment_method ENUM('credit_card', 'debit_card', 'pix', 'cash', 'bank_slip', 'transfer') NOT NULL,
  credit_card_id CHAR(36),
  is_installment BOOLEAN DEFAULT FALSE,
  total_installments INT,
  current_installment INT,
  installment_group_id CHAR(36),
  notes TEXT,
  attachment_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_date (date),
  INDEX idx_user_id (user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_category_id (category_id),
  INDEX idx_credit_card_id (credit_card_id),
  INDEX idx_installment_group_id (installment_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

