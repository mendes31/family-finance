-- ============================================
-- Migration 016: Add color field to credit_cards
-- Descrição: Adiciona campo de cor personalizada para cartões de crédito
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Adicionar campo de cor
ALTER TABLE credit_cards
ADD COLUMN color VARCHAR(7) NULL AFTER brand;

