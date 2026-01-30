-- ============================================
-- VERIFICAÇÃO ESPECÍFICA - Execute no phpMyAdmin
-- Substitua 'rafamendesoliveira.rm@gmail.com' pelo seu e-mail
-- ============================================

USE family_finance;

-- 1. Verificar se você está na tabela users
SELECT id, email FROM users WHERE email = 'rafamendesoliveira.rm@gmail.com';

-- 2. Verificar se você está na tabela family_members
SELECT 
    fm.id,
    fm.family_id,
    f.name as family_name,
    fm.user_id,
    u.email,
    fm.joined_at
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 3. Se a query acima retornar VAZIO, execute este comando:
-- (Use o user_id da query 1 e o family_id da família "Familia Rafa")
/*
INSERT INTO family_members (id, family_id, user_id, joined_at)
VALUES (
    UUID(),
    'fc70ea93-0cfc-4a7a-a46a-891171b10341',  -- ID da família "Familia Rafa"
    'SEU_USER_ID_AQUI',  -- Substitua pelo user_id obtido na query 1
    NOW()
);
*/

-- 4. OU use este comando automático (adiciona todos os usuários à família):
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

-- 5. Verificar novamente após executar o INSERT
SELECT 
    u.email,
    f.name as family_name
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';


