-- Script para aceitar convite manualmente e criar o usuário
-- ATENÇÃO: Use apenas se o usuário não conseguir aceitar pelo link normal
-- Execute este script APENAS se souber a senha que foi enviada por e-mail

USE family_finance;

-- 1. Verificar convite pendente
SELECT 
    fi.id as invitation_id,
    fi.email,
    fi.full_name,
    fi.invitation_type,
    fi.role,
    fi.family_id,
    fi.token,
    fi.expires_at,
    CASE 
        WHEN fi.password_hash IS NULL THEN 'SEM SENHA (pre_register)'
        ELSE 'COM SENHA (full_register)'
    END as tipo_convite
FROM family_invitations fi
WHERE fi.email = 'rafamendesoliveira.rm@gmail.com'
  AND fi.status = 'pending'
  AND fi.expires_at > NOW()
ORDER BY fi.created_at DESC
LIMIT 1;

-- 2. IMPORTANTE: Para aceitar o convite, você precisa:
--    - Se for 'pre_register': criar uma senha nova
--    - Se for 'full_register': usar a senha que foi enviada por e-mail
--
--    Execute o script PHP abaixo ou use a página web:
--    http://localhost/family_finance/accept-invitation?token=TOKEN_DO_CONVITE
--
--    Para obter o token, execute:
SELECT 
    fi.token,
    CONCAT('http://localhost/family_finance/accept-invitation?token=', fi.token) as link_aceitacao
FROM family_invitations fi
WHERE fi.email = 'rafamendesoliveira.rm@gmail.com'
  AND fi.status = 'pending'
  AND fi.expires_at > NOW()
ORDER BY fi.created_at DESC
LIMIT 1;

-- 3. Se precisar aceitar manualmente via SQL (NÃO RECOMENDADO):
--    Descomente e ajuste os valores abaixo:

/*
-- Obter dados do convite
SET @invitation_id = 'ID_DO_CONVITE_AQUI';
SET @email = 'rafamendesoliveira.rm@gmail.com';
SET @senha_plana = 'SENHA_DO_EMAIL_AQUI'; -- Para full_register, use a senha do e-mail
SET @user_id = UUID();
SET @member_id = UUID();
SET @role_id = UUID();

-- Buscar dados do convite
SELECT 
    id, family_id, full_name, role, invitation_type, password_hash
INTO @family_id, @full_name, @role, @invitation_type, @password_hash_convite
FROM family_invitations
WHERE id = @invitation_id AND status = 'pending';

-- Verificar se encontrou o convite
SELECT @family_id as family_id_encontrado, @invitation_type as tipo;

-- Criar usuário
INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
VALUES (
    @user_id,
    @email,
    CASE 
        WHEN @invitation_type = 'full_register' THEN @password_hash_convite
        ELSE SHA2(@senha_plana, 256) -- NÃO USE SHA2! Use password_hash do PHP
    END,
    TRUE,
    NOW(),
    NOW()
);

-- Criar perfil
INSERT INTO profiles (id, full_name, email, created_at, updated_at)
VALUES (@user_id, @full_name, @email, NOW(), NOW());

-- Criar role
INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (@role_id, @user_id, @role, NOW());

-- Adicionar à família
INSERT INTO family_members (id, family_id, user_id, joined_at)
VALUES (@member_id, @family_id, @user_id, NOW());

-- Marcar convite como aceito
UPDATE family_invitations 
SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
WHERE id = @invitation_id;

-- Verificar resultado
SELECT 
    u.id,
    u.email,
    p.full_name,
    ur.role,
    f.name as family_name
FROM users u
INNER JOIN profiles p ON p.id = u.id
INNER JOIN user_roles ur ON ur.user_id = u.id
INNER JOIN family_members fm ON fm.user_id = u.id
INNER JOIN families f ON f.id = fm.family_id
WHERE u.email = @email;
*/


