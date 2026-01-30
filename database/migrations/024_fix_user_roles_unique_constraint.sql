-- ============================================
-- Migration 024: Fix User Roles Unique Constraint
-- Descrição: Garante que cada usuário tenha apenas UMA role (admin ou user)
-- Data: 2026-01-10
-- ============================================

USE family_finance;

-- PROBLEMA IDENTIFICADO:
-- A constraint atual permite que um usuário tenha múltiplas roles (user E admin)
-- Isso não faz sentido - um usuário deve ter apenas UMA role

-- 1. Corrigir: Manter apenas a role 'admin' se o usuário tiver ambas
-- (Admin tem prioridade sobre user)
DELETE ur1 FROM user_roles ur1
INNER JOIN user_roles ur2 ON ur1.user_id = ur2.user_id
WHERE ur1.role = 'user' 
AND ur2.role = 'admin'
AND ur1.id != ur2.id;

-- 2. Criar nova constraint: apenas UMA role por usuário
-- Se já existir uma role, não permitir inserir outra
-- Nota: Se der erro "Duplicate key name", significa que a constraint já existe - pode ignorar
ALTER TABLE user_roles 
ADD UNIQUE KEY unique_user_id (user_id);
