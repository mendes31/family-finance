<?php
/**
 * Verificar se as funções foram criadas
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
    
    echo "🔍 Verificando funções no banco...\n\n";
    
    $stmt = $pdo->query("SHOW FUNCTION STATUS WHERE Db = '$db_name'");
    $funcs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Funções encontradas: " . count($funcs) . "\n";
    foreach ($funcs as $f) {
        echo "   ✅ " . $f['Name'] . "\n";
    }
    
    if (count($funcs) == 0) {
        echo "\n❌ Nenhuma função encontrada!\n";
        echo "   A migration 012_create_functions.sql precisa ser executada.\n";
    }
    
} catch (PDOException $e) {
    die("❌ Erro: " . $e->getMessage() . "\n");
}

