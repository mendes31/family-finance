-- ============================================
-- Migration 013: Create triggers
-- Descrição: Cria triggers automáticos
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Trigger para criar perfil automaticamente ao criar usuário
DROP TRIGGER IF EXISTS after_user_insert;
DELIMITER //
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  -- Criar perfil
  INSERT INTO profiles (id, full_name, email)
  VALUES (NEW.id, NEW.email, NEW.email);
  
  -- Atribuir role padrão
  INSERT INTO user_roles (id, user_id, role)
  VALUES (generate_uuid(), NEW.id, 'user');
END//
DELIMITER ;

