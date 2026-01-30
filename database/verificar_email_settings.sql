-- ============================================
-- Script para verificar configurações de e-mail
-- Execute no phpMyAdmin para diagnosticar
-- ============================================

USE family_finance;

-- 1. Verificar todas as configurações de e-mail
SELECT 
    es.id,
    es.family_id,
    f.name as family_name,
    es.smtp_host,
    es.smtp_user,
    es.smtp_port,
    es.smtp_encryption,
    es.from_email,
    es.from_name,
    es.is_active,
    es.created_at,
    es.updated_at
FROM email_settings es
LEFT JOIN families f ON f.id = es.family_id
ORDER BY es.created_at DESC;

-- 2. Verificar se há configurações inativas
SELECT 
    es.family_id,
    f.name as family_name,
    es.is_active,
    es.updated_at
FROM email_settings es
LEFT JOIN families f ON f.id = es.family_id
WHERE es.is_active = FALSE;

-- 3. Ativar todas as configurações (se necessário)
-- Descomente para executar:
/*
UPDATE email_settings 
SET is_active = TRUE 
WHERE is_active = FALSE;
*/

-- 4. Verificar família específica (substitua o ID)
-- Substitua 'FAMILY_ID_AQUI' pelo ID da sua família
/*
SELECT 
    es.*,
    f.name as family_name
FROM email_settings es
INNER JOIN families f ON f.id = es.family_id
WHERE es.family_id = 'FAMILY_ID_AQUI';
*/


