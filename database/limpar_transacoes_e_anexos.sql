-- ============================================
-- Script: Limpar todas as transações e anexos
-- Descrição: Remove todos os registros de lançamentos e anexos para iniciar novos testes
-- Aviso: Este comando é DESTRUTIVO e não pode ser desfeito!
-- ============================================

USE family_finance;

-- Desabilitar verificação de foreign keys temporariamente para melhor performance
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Deletar todos os anexos de transações
DELETE FROM transaction_attachments;

-- 2. Deletar todas as transações
DELETE FROM transactions;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar se as tabelas foram limpas
SELECT 
    'transaction_attachments' AS tabela,
    COUNT(*) AS registros_restantes
FROM transaction_attachments
UNION ALL
SELECT 
    'transactions' AS tabela,
    COUNT(*) AS registros_restantes
FROM transactions;

-- Mensagem de confirmação
SELECT '✅ Todas as transações e anexos foram removidos com sucesso!' AS resultado;

