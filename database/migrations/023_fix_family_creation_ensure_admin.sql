-- ============================================
-- Migration 023: Fix Family Creation - Ensure Admin
-- Descrição: Garante que ao criar uma família, o criador seja automaticamente admin
-- Data: 2026-01-10
-- ============================================

USE family_finance;

-- Corrigir: Adicionar role de admin para criadores de família que não são admin
-- Este script garante que o primeiro membro de cada família seja admin

-- 1. Atualizar roles existentes para 'admin' se o usuário é o primeiro membro
UPDATE user_roles ur
INNER JOIN (
    SELECT fm.user_id, fm.family_id
    FROM family_members fm
    WHERE fm.joined_at = (
        SELECT MIN(fm2.joined_at) 
        FROM family_members fm2 
        WHERE fm2.family_id = fm.family_id
    )
) as first_members ON first_members.user_id = ur.user_id
SET ur.role = 'admin'
WHERE ur.role != 'admin';

-- 2. Inserir role de admin para usuários que são primeiros membros mas não têm role
INSERT INTO user_roles (id, user_id, role, created_at)
SELECT 
    UUID() as id,
    first_members.user_id,
    'admin' as role,
    NOW() as created_at
FROM (
    SELECT DISTINCT fm.user_id
    FROM family_members fm
    WHERE fm.joined_at = (
        SELECT MIN(fm2.joined_at) 
        FROM family_members fm2 
        WHERE fm2.family_id = fm.family_id
    )
) as first_members
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = first_members.user_id
);
