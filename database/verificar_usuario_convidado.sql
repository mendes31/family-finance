-- Script para verificar usuário convidado e diagnosticar problemas de login
-- Execute este script para verificar se o usuário foi criado corretamente

USE family_finance;

-- 1. Verificar se o usuário existe
SELECT 
    u.id,
    u.email,
    u.email_verified,
    u.created_at,
    CASE 
        WHEN u.password_hash IS NULL THEN 'SEM SENHA'
        WHEN LENGTH(u.password_hash) < 20 THEN 'HASH SUSPEITO'
        ELSE 'OK'
    END as status_senha,
    SUBSTRING(u.password_hash, 1, 20) as hash_preview
FROM users u
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 2. Verificar perfil
SELECT 
    p.id,
    p.full_name,
    p.email
FROM profiles p
INNER JOIN users u ON u.id = p.id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 3. Verificar role
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    u.email
FROM user_roles ur
INNER JOIN users u ON u.id = ur.user_id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 4. Verificar família
SELECT 
    fm.id,
    fm.family_id,
    f.name as family_name,
    fm.joined_at,
    u.email
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

-- 5. Verificar convites (últimos 5)
SELECT 
    fi.id,
    fi.email,
    fi.invitation_type,
    fi.status,
    fi.expires_at,
    CASE 
        WHEN fi.password_hash IS NULL THEN 'SEM SENHA'
        WHEN LENGTH(fi.password_hash) < 20 THEN 'HASH SUSPEITO'
        ELSE 'OK'
    END as status_senha_convite,
    SUBSTRING(fi.password_hash, 1, 20) as hash_preview_convite,
    CONCAT('http://localhost/family_finance/accept-invitation?token=', fi.token) as link_aceitacao
FROM family_invitations fi
WHERE fi.email = 'rafamendesoliveira.rm@gmail.com'
ORDER BY fi.created_at DESC
LIMIT 5;

-- 6. Testar hash de senha (substitua 'SENHA_TESTE' pela senha que você recebeu por e-mail)
-- Descomente e execute apenas se souber a senha:
-- SELECT 
--     'SENHA_TESTE' as senha_teste,
--     u.password_hash as hash_armazenado,
--     CASE 
--         WHEN password_verify('SENHA_TESTE', u.password_hash) THEN 'SENHA CORRETA'
--         ELSE 'SENHA INCORRETA'
--     END as resultado_verificacao
-- FROM users u
-- WHERE u.email = 'rafamendesoliveira.rm@gmail.com';

