-- ============================================
-- SOLUÇÃO RÁPIDA - Execute tudo de uma vez
-- ============================================

USE family_finance;

-- 1. Criar família se não existir
INSERT INTO families (id, name, created_at, updated_at)
SELECT 
    UUID() as id,
    'Minha Família' as name,
    NOW() as created_at,
    NOW() as updated_at
FROM (SELECT 1) as tmp
WHERE NOT EXISTS (SELECT 1 FROM families LIMIT 1);

-- 2. Adicionar todos os usuários à primeira família
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
AND EXISTS (SELECT 1 FROM families LIMIT 1);

-- 3. Verificar resultado
SELECT 
    u.email,
    u.full_name,
    f.name as family_name,
    fm.joined_at
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
ORDER BY f.name, u.full_name;

