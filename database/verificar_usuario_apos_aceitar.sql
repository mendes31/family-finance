-- Script para verificar se o usuário foi criado corretamente após aceitar o convite
-- Execute este script após aceitar um convite para verificar se tudo está correto

USE family_finance;

-- 1. Verificar se o usuário existe
SELECT 
    u.id,
    u.email,
    u.email_verified,
    u.created_at,
    CASE 
        WHEN u.password_hash IS NULL THEN '❌ SEM SENHA'
        WHEN LENGTH(u.password_hash) < 20 THEN '⚠️ HASH SUSPEITO'
        ELSE '✅ OK'
    END as status_senha,
    SUBSTRING(u.password_hash, 1, 30) as hash_preview,
    LENGTH(u.password_hash) as tamanho_hash
FROM users u
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 2. Verificar perfil
SELECT 
    p.id,
    p.full_name,
    p.email,
    CASE 
        WHEN p.id IS NULL THEN '❌ SEM PERFIL'
        ELSE '✅ OK'
    END as status_perfil
FROM profiles p
INNER JOIN users u ON u.id = p.id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 3. Verificar role
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    u.email,
    CASE 
        WHEN ur.id IS NULL THEN '❌ SEM ROLE'
        ELSE '✅ OK'
    END as status_role
FROM user_roles ur
INNER JOIN users u ON u.id = ur.user_id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 4. Verificar família
SELECT 
    fm.id,
    fm.family_id,
    f.name as family_name,
    fm.joined_at,
    u.email,
    CASE 
        WHEN fm.id IS NULL THEN '❌ NÃO É MEMBRO'
        ELSE '✅ OK'
    END as status_familia
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 5. Verificar convites (status atualizado)
SELECT 
    fi.id,
    fi.email,
    fi.invitation_type,
    fi.status,
    fi.accepted_at,
    fi.expires_at,
    CASE 
        WHEN fi.status = 'accepted' THEN '✅ ACEITO'
        WHEN fi.status = 'pending' THEN '⏳ PENDENTE'
        WHEN fi.status = 'cancelled' THEN '❌ CANCELADO'
        ELSE '❓ DESCONHECIDO'
    END as status_convite
FROM family_invitations fi
WHERE fi.email = 'rafamendesoliveira.rm@gmail.com'
ORDER BY fi.created_at DESC
LIMIT 5;

-- 6. Testar verificação de senha (substitua 'SENHA_TESTE' pela senha que você está usando)
-- IMPORTANTE: Esta query só funciona se você souber a senha
-- Descomente e ajuste a senha:
/*
SELECT 
    u.email,
    'SENHA_TESTE' as senha_teste,
    SUBSTRING(u.password_hash, 1, 30) as hash_armazenado,
    CASE 
        WHEN password_verify('SENHA_TESTE', u.password_hash) THEN '✅ SENHA CORRETA'
        ELSE '❌ SENHA INCORRETA'
    END as resultado_verificacao
FROM users u
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';
*/

-- 7. Verificar se há múltiplos usuários com o mesmo email (não deveria acontecer)
SELECT 
    COUNT(*) as total_usuarios,
    GROUP_CONCAT(id SEPARATOR ', ') as ids
FROM users
WHERE email = 'rafamendesoliveira.rm@gmail.com';

-- 8. Verificar logs de erro recentes (se houver tabela de logs)
-- SELECT * FROM email_logs 
-- WHERE recipient_email = 'rafamendesoliveira.rm@gmail.com'
-- ORDER BY created_at DESC
-- LIMIT 5;


