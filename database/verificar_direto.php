<?php
/**
 * Verificação direta das tabelas no banco
 */

function loadEnv($file) {
    $env = [];
    if (!file_exists($file)) {
        return $env;
    }
    
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $value = trim($value, '"\'');
            $env[$key] = $value;
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
    
    // Verificar tabelas diretamente
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "📊 Total de tabelas no banco: " . count($tables) . "\n\n";
    echo "✅ Tabelas encontradas:\n";
    foreach ($tables as $table) {
        // Verificar estrutura da tabela
        $stmt2 = $pdo->query("SHOW CREATE TABLE `$table`");
        $create = $stmt2->fetch(PDO::FETCH_ASSOC);
        echo "   - $table\n";
    }
    
    // Verificar migrations registradas
    echo "\n📋 Migrations registradas:\n";
    $stmt = $pdo->query("SELECT migration_name FROM migrations ORDER BY executed_at");
    $migrations = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($migrations as $migration) {
        echo "   - $migration\n";
    }
    
} catch (PDOException $e) {
    die("❌ Erro: " . $e->getMessage() . "\n");
}

