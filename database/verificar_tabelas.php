<?php
/**
 * Script para verificar quais tabelas foram criadas no banco
 */

// Função para ler arquivo .env
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
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "📊 Tabelas criadas no banco: " . count($tables) . "\n\n";
    
    $expected_tables = [
        'users',
        'families',
        'profiles',
        'user_roles',
        'family_members',
        'categories',
        'credit_cards',
        'transactions',
        'budgets',
        'financial_goals',
        'alerts',
        'migrations'
    ];
    
    echo "✅ Tabelas encontradas:\n";
    foreach ($tables as $table) {
        echo "   - $table\n";
    }
    
    echo "\n❌ Tabelas faltando:\n";
    $missing = array_diff($expected_tables, $tables);
    if (empty($missing)) {
        echo "   Nenhuma! Todas as tabelas foram criadas.\n";
    } else {
        foreach ($missing as $table) {
            echo "   - $table\n";
        }
    }
    
} catch (PDOException $e) {
    die("❌ Erro: " . $e->getMessage() . "\n");
}

