-- Script para verificar e corrigir membros da família
-- Execute este script se o usuário não conseguir salvar configurações de e-mail

USE family_finance;

-- 1. Verificar usuários que não estão em family_members mas têm família
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    f.id as family_id,
    f.name as family_name
FROM users u
LEFT JOIN family_members fm ON fm.user_id = u.id
LEFT JOIN families f ON f.id = (
    SELECT fm2.family_id 
    FROM family_members fm2 
    WHERE fm2.user_id = u.id 
    LIMIT 1
)
WHERE fm.id IS NULL
AND EXISTS (
    SELECT 1 FROM families f2 
    WHERE f2.id IN (
        SELECT fm3.family_id FROM family_members fm3
    )
);

-- 2. Se você encontrar usuários sem família, você pode:
--    a) Criar uma família para eles
--    b) Adicioná-los a uma família existente

-- 3. Para adicionar um usuário a uma família existente (substitua os valores):
-- INSERT INTO family_members (id, family_id, user_id, joined_at)
-- VALUES (
--     UUID(), -- ou use generate_uuid() se disponível
--     'FAMILY_ID_AQUI',
--     'USER_ID_AQUI',
--     NOW()
-- );

-- 4. Para verificar todos os membros de família:
SELECT 
    fm.id,
    fm.family_id,
    f.name as family_name,
    fm.user_id,
    u.email,
    u.full_name,
    fm.joined_at
FROM family_members fm
INNER JOIN families f ON f.id = fm.family_id
INNER JOIN users u ON u.id = fm.user_id
ORDER BY f.name, u.full_name;


