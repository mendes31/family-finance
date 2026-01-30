-- ============================================
-- Script para corrigir membros da família
-- Execute este script no phpMyAdmin ou MySQL
-- ============================================

USE family_finance;

-- 1. Verificar usuários sem família
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    CASE 
        WHEN fm.id IS NULL THEN 'SEM FAMÍLIA'
        ELSE 'COM FAMÍLIA'
    END as status
FROM users u
LEFT JOIN family_members fm ON fm.user_id = u.id
WHERE fm.id IS NULL
ORDER BY u.email;

-- 2. Verificar famílias existentes
SELECT 
    f.id as family_id,
    f.name as family_name,
    COUNT(fm.id) as total_membros,
    GROUP_CONCAT(u.email SEPARATOR ', ') as membros
FROM families f
LEFT JOIN family_members fm ON fm.family_id = f.id
LEFT JOIN users u ON u.id = fm.user_id
GROUP BY f.id, f.name
ORDER BY f.name;

-- 3. Adicionar usuários sem família à primeira família disponível
-- (Ajuste o WHERE conforme necessário para selecionar usuários específicos)
INSERT INTO family_members (id, family_id, user_id, joined_at)
SELECT 
    UUID() as id,
    (SELECT id FROM families ORDER BY created_at LIMIT 1) as family_id,
    u.id as user_id,
    NOW() as joined_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id
)
AND EXISTS (
    SELECT 1 FROM families LIMIT 1
);

-- 4. Verificar resultado
SELECT 
    u.email,
    u.full_name,
    f.name as family_name,
    fm.joined_at
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
ORDER BY f.name, u.full_name;


