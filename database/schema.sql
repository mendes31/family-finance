-- ============================================
-- Family Finance Hub - Schema MySQL
-- Convertido de PostgreSQL (Supabase) para MySQL
-- ============================================

-- Usar o banco de dados
USE family_finance;

-- ============================================
-- TABELA: users (substitui auth.users do Supabase)
-- ============================================
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: families
-- ============================================
CREATE TABLE families (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: profiles (perfis de usuários)
-- ============================================
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_whatsapp VARCHAR(20),
  avatar_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: user_roles (roles dos usuários)
-- ============================================
CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: family_members (relação usuários-famílias)
-- ============================================
CREATE TABLE family_members (
  id CHAR(36) PRIMARY KEY,
  family_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_family_user (family_id, user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: categories (categorias de transações)
-- ============================================
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('income', 'expense', 'investment') NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  family_id CHAR(36),
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_family_id (family_id),
  INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: credit_cards (cartões de crédito)
-- ============================================
CREATE TABLE credit_cards (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  holder_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_day TINYINT NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day TINYINT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (holder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_holder_id (holder_id),
  INDEX idx_family_id (family_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: transactions (transações financeiras)
-- ============================================
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY,
  type ENUM('income', 'expense', 'investment') NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  category_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  payment_method ENUM('credit_card', 'debit_card', 'pix', 'cash', 'bank_slip', 'transfer') NOT NULL,
  credit_card_id CHAR(36),
  is_installment BOOLEAN DEFAULT FALSE,
  total_installments INT,
  current_installment INT,
  installment_group_id CHAR(36),
  notes TEXT,
  attachment_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_date (date),
  INDEX idx_user_id (user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_category_id (category_id),
  INDEX idx_credit_card_id (credit_card_id),
  INDEX idx_installment_group_id (installment_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: budgets (orçamentos mensais)
-- ============================================
CREATE TABLE budgets (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  month TINYINT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  limit_amount DECIMAL(15,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_budget (category_id, family_id, user_id, month, year),
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id),
  INDEX idx_month_year (month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: financial_goals (metas financeiras)
-- ============================================
CREATE TABLE financial_goals (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  family_id CHAR(36) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  INDEX idx_family_id (family_id),
  INDEX idx_is_completed (is_completed),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: alerts (alertas e notificações)
-- ============================================
CREATE TABLE alerts (
  id CHAR(36) PRIMARY KEY,
  type ENUM('due_date', 'budget_exceeded', 'goal_progress', 'installment') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  channel ENUM('app', 'whatsapp', 'email') NOT NULL DEFAULT 'app',
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for DATETIME,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_scheduled_for (scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FUNÇÃO AUXILIAR: Gerar UUID no formato CHAR(36)
-- ============================================
-- Nota: Esta função pode não funcionar em versões antigas do MySQL
-- Se der erro, o backend deve gerar os UUIDs programaticamente
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

-- Nota: Se a função acima não funcionar:
-- 1. Use MySQL 8.0+ que tem UUID() nativo
-- 2. Ou deixe o backend gerar todos os UUIDs programaticamente
-- 3. Ou use valores UUID fixos para dados iniciais

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Função para verificar se usuário tem role específica
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
  -- Nota: Se generate_uuid() não funcionar, o backend deve gerar o UUID
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para criar perfil automaticamente ao criar usuário
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

-- ============================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

-- Índices compostos para queries frequentes
CREATE INDEX idx_transactions_family_date ON transactions(family_id, date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_type_date ON transactions(type, date);
CREATE INDEX idx_budgets_family_month_year ON budgets(family_id, month, year);
CREATE INDEX idx_alerts_user_read ON alerts(user_id, is_read);

-- ============================================
-- FIM DO SCHEMA
-- ============================================

