-- ============================================
-- EXECUTE ESTE SCRIPT NO phpMyAdmin
-- Copie TODO o conteúdo e cole na aba SQL
-- ============================================

USE family_finance;

-- 1. Verificar se há família (execute primeiro para ver)
SELECT id, name FROM families;

-- 2. Se não houver família, execute este comando:
-- (Copie e execute separadamente se a query acima retornar vazio)
INSERT INTO families (id, name, created_at, updated_at)
VALUES (UUID(), 'Minha Família', NOW(), NOW());

-- 3. Verificar se há usuários
SELECT id, email FROM users;

-- 4. Adicionar todos os usuários à família
-- (Execute este comando - ele só adiciona quem ainda não está na família)
INSERT INTO family_members (id, family_id, user_id, joined_at)
SELECT 
    UUID() as id,
    (SELECT id FROM families ORDER BY created_at LIMIT 1) as family_id,
    u.id as user_id,
    NOW() as joined_at
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.user_id = u.id
);

-- 5. Verificar resultado (você deve aparecer na lista)
SELECT 
    u.email,
    u.id as user_id,
    f.name as family_name,
    f.id as family_id
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id;

