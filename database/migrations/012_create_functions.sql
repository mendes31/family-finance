-- ============================================
-- Migration 012: Create functions
-- Descrição: Cria funções auxiliares (has_role, user_in_family, generate_uuid)
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Função para gerar UUID (se não existir)
DROP FUNCTION IF EXISTS generate_uuid;
DELIMITER //
CREATE FUNCTION generate_uuid()
RETURNS CHAR(36)
READS SQL DATA
DETERMINISTIC
BEGIN
  -- Versão simplificada que funciona na maioria dos casos
  -- Para produção, recomenda-se gerar UUIDs no backend
  RETURN LOWER(CONCAT(
    LPAD(HEX(FLOOR(RAND() * 4294967296)), 8, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 65536)), 4, '0'), '-',
    '4', LPAD(HEX(FLOOR(RAND() * 4096)), 3, '0'), '-',
    LPAD(HEX(FLOOR(8 + RAND() * 8)), 1, '0'), LPAD(HEX(FLOOR(RAND() * 4096)), 3, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 281474976710656)), 12, '0')
  ));
END//
DELIMITER ;

-- Função para verificar se usuário tem role específica
DROP FUNCTION IF EXISTS has_role;
DELIMITER //
CREATE FUNCTION has_role(p_user_id CHAR(36), p_role VARCHAR(10))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_exists BOOLEAN;
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = p_role
  ) INTO v_exists;
  RETURN v_exists;
END//
DELIMITER ;

-- Função para verificar se usuário pertence à família
DROP FUNCTION IF EXISTS user_in_family;
DELIMITER //
CREATE FUNCTION user_in_family(p_user_id CHAR(36), p_family_id CHAR(36))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_exists BOOLEAN;
  SELECT EXISTS(
    SELECT 1 FROM family_members
    WHERE user_id = p_user_id AND family_id = p_family_id
  ) INTO v_exists;
  RETURN v_exists;
END//
DELIMITER ;

-- Stored procedure para criar família com admin
DROP PROCEDURE IF EXISTS create_family_with_admin;
DELIMITER //
CREATE PROCEDURE create_family_with_admin(
  IN p_family_name VARCHAR(255),
  IN p_user_id CHAR(36),
  OUT p_family_id CHAR(36)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Verificar se usuário já tem família
  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = p_user_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already belongs to a family';
  END IF;

  -- Gerar UUID para família
  SET p_family_id = generate_uuid();

  -- Criar família
  INSERT INTO families (id, name) VALUES (p_family_id, p_family_name);

  -- Adicionar usuário como membro
  INSERT INTO family_members (id, family_id, user_id) 
  VALUES (generate_uuid(), p_family_id, p_user_id);

  -- Promover a admin
  UPDATE user_roles SET role = 'admin' WHERE user_id = p_user_id;

  COMMIT;
END//
DELIMITER ;

