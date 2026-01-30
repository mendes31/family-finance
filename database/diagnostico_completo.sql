-- ============================================
-- DIAGNÓSTICO COMPLETO - Execute passo a passo
-- ============================================

USE family_finance;

-- PASSO 1: Verificar se existem usuários
SELECT '=== USUÁRIOS ===' as info;
SELECT id, email, full_name FROM users;

-- PASSO 2: Verificar se existem famílias
SELECT '=== FAMÍLIAS ===' as info;
SELECT id, name, created_at FROM families;

-- PASSO 3: Verificar membros da família
SELECT '=== MEMBROS DA FAMÍLIA ===' as info;
SELECT 
    fm.id,
    fm.family_id,
    f.name as family_name,
    fm.user_id,
    u.email,
    u.full_name,
    fm.joined_at
FROM family_members fm
LEFT JOIN families f ON f.id = fm.family_id
LEFT JOIN users u ON u.id = fm.user_id;

-- PASSO 4: Verificar usuários SEM família
SELECT '=== USUÁRIOS SEM FAMÍLIA ===' as info;
SELECT 
    u.id as user_id,
    u.email,
    u.full_name
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id
);

-- PASSO 5: Se houver usuários sem família E houver famílias, execute este INSERT:
-- (Descomente e ajuste se necessário)
/*
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
*/


