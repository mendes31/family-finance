-- ============================================
-- VERIFICAÇÃO CORRIGIDA - Execute no phpMyAdmin
-- ============================================

USE family_finance;

-- 1. Verificar estrutura da tabela users
DESCRIBE users;

-- 2. Verificar usuários existentes
SELECT id, email FROM users;

-- 3. Verificar família existente
SELECT id, name FROM families;

-- 4. Verificar membros da família (query corrigida - SEM full_name)
SELECT 
    u.email,
    u.id as user_id,
    f.name as family_name,
    f.id as family_id,
    fm.joined_at
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id;

-- 5. Verificar se há usuários SEM família
SELECT 
    u.id as user_id,
    u.email
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id
);

-- 6. Se houver usuários sem família, execute este comando:
-- (Substitua 'FAMILY_ID_AQUI' pelo ID da família que você viu no passo 3)
/*
INSERT INTO family_members (id, family_id, user_id, joined_at)
SELECT 
    UUID() as id,
    'fc70ea93-0cfc-4a7a-a46a-891171b10341' as family_id,  -- ID da sua família
    u.id as user_id,
    NOW() as joined_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id
);
*/

