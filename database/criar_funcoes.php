<?php
/**
 * Script para criar as funções manualmente (DELIMITER não funciona com PDO)
 */

function loadEnv($file) {
    $env = [];
    if (!file_exists($file)) return $env;
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim(trim($value), '"\'');
        }
    }
    return $env;
}

$env_file = __DIR__ . '/../.env';
$env = loadEnv($env_file);
$db_host = $env['DB_HOST'] ?? 'localhost';
$db_user = $env['DB_USER'] ?? 'root';
$db_password = $env['DB_PASS'] ?? $env['DB_PASSWORD'] ?? '';
$db_name = $env['DB_NAME'] ?? 'family_finance';
$db_port = $env['DB_PORT'] ?? 3306;

try {
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    echo "🔧 Criando funções...\n\n";
    
    // Função generate_uuid
    echo "📝 Criando função generate_uuid()...\n";
    $pdo->exec("DROP FUNCTION IF EXISTS generate_uuid");
    
    // Criar função sem DELIMITER - usar definição direta
    $sql = "CREATE FUNCTION generate_uuid()
RETURNS CHAR(36)
READS SQL DATA
DETERMINISTIC
BEGIN
  RETURN LOWER(CONCAT(
    LPAD(HEX(FLOOR(RAND() * 4294967296)), 8, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 65536)), 4, '0'), '-',
    '4', LPAD(HEX(FLOOR(RAND() * 4096)), 3, '0'), '-',
    LPAD(HEX(FLOOR(8 + RAND() * 8)), 1, '0'), LPAD(HEX(FLOOR(RAND() * 4096)), 3, '0'), '-',
    LPAD(HEX(FLOOR(RAND() * 281474976710656)), 12, '0')
  ));
END";
    
    $pdo->exec($sql);
    echo "   ✅ generate_uuid() criada\n\n";
    
    // Função has_role
    echo "📝 Criando função has_role()...\n";
    $pdo->exec("DROP FUNCTION IF EXISTS has_role");
    
    $sql = "CREATE FUNCTION has_role(p_user_id CHAR(36), p_role VARCHAR(10))
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
END";
    
    $pdo->exec($sql);
    echo "   ✅ has_role() criada\n\n";
    
    // Função user_in_family
    echo "📝 Criando função user_in_family()...\n";
    $pdo->exec("DROP FUNCTION IF EXISTS user_in_family");
    
    $sql = "CREATE FUNCTION user_in_family(p_user_id CHAR(36), p_family_id CHAR(36))
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
END";
    
    $pdo->exec($sql);
    echo "   ✅ user_in_family() criada\n\n";
    
    // Procedure create_family_with_admin
    echo "📝 Criando procedure create_family_with_admin()...\n";
    $pdo->exec("DROP PROCEDURE IF EXISTS create_family_with_admin");
    
    $sql = "CREATE PROCEDURE create_family_with_admin(
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

  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = p_user_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already belongs to a family';
  END IF;

  SET p_family_id = generate_uuid();

  INSERT INTO families (id, name) VALUES (p_family_id, p_family_name);

  INSERT INTO family_members (id, family_id, user_id) 
  VALUES (generate_uuid(), p_family_id, p_user_id);

  UPDATE user_roles SET role = 'admin' WHERE user_id = p_user_id;

  COMMIT;
END";
    
    $pdo->exec($sql);
    echo "   ✅ create_family_with_admin() criada\n\n";
    
    echo "✅ Todas as funções e procedures foram criadas com sucesso!\n";
    
} catch (PDOException $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "   Código: " . $e->getCode() . "\n";
}

