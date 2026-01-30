-- ============================================
-- SOLUÇÃO DEFINITIVA - Execute no phpMyAdmin
-- Este script cria família e adiciona usuários automaticamente
-- ============================================

USE family_finance;

-- PASSO 1: Verificar o que existe
SELECT '=== VERIFICANDO DADOS ===' as info;

SELECT 'Usuários:' as tipo, COUNT(*) as total FROM users
UNION ALL
SELECT 'Famílias:', COUNT(*) FROM families
UNION ALL
SELECT 'Membros:', COUNT(*) FROM family_members;

-- PASSO 2: Criar família se não existir (execute apenas se não houver família)
-- Descomente as linhas abaixo se não houver família:
/*
INSERT INTO families (id, name, created_at, updated_at)
VALUES (UUID(), 'Minha Família', NOW(), NOW());
*/

-- OU use este comando que só cria se não existir:
INSERT IGNORE INTO families (id, name, created_at, updated_at)
SELECT UUID(), 'Minha Família', NOW(), NOW()
FROM (SELECT 1) as tmp
WHERE (SELECT COUNT(*) FROM families) = 0;

-- PASSO 3: Adicionar todos os usuários à primeira família
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
AND (SELECT COUNT(*) FROM families) > 0;

-- PASSO 4: Verificar resultado final
SELECT '=== RESULTADO FINAL ===' as info;

SELECT 
    u.email,
    u.full_name,
    f.name as family_name,
    fm.joined_at
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
ORDER BY f.name, u.full_name;


