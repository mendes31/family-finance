<?php
/**
 * Script para limpar registros de migrations que falharam e reexecutá-las
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
    
    // Verificar quais tabelas existem
    $stmt = $pdo->query("SHOW TABLES");
    $existing_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Mapear migrations para tabelas esperadas
    $migration_to_table = [
        '001_create_users_table.sql' => 'users',
        '002_create_families_table.sql' => 'families',
        '003_create_profiles_table.sql' => 'profiles',
        '004_create_user_roles_table.sql' => 'user_roles',
        '005_create_family_members_table.sql' => 'family_members',
        '006_create_categories_table.sql' => 'categories',
        '007_create_credit_cards_table.sql' => 'credit_cards',
        '008_create_transactions_table.sql' => 'transactions',
        '009_create_budgets_table.sql' => 'budgets',
        '010_create_financial_goals_table.sql' => 'financial_goals',
        '011_create_alerts_table.sql' => 'alerts',
    ];
    
    // Buscar migrations registradas
    $stmt = $pdo->query("SELECT migration_name FROM migrations");
    $registered_migrations = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "🧹 Limpando registros de migrations que falharam...\n\n";
    
    $cleaned = 0;
    foreach ($registered_migrations as $migration) {
        if (isset($migration_to_table[$migration])) {
            $expected_table = $migration_to_table[$migration];
            if (!in_array($expected_table, $existing_tables)) {
                // Migration registrada mas tabela não existe - remover registro
                $stmt = $pdo->prepare("DELETE FROM migrations WHERE migration_name = ?");
                $stmt->execute([$migration]);
                echo "   ❌ Removido: $migration (tabela '$expected_table' não existe)\n";
                $cleaned++;
            }
        }
    }
    
    if ($cleaned > 0) {
        echo "\n✅ $cleaned registro(s) removido(s).\n";
        echo "\n🔄 Agora execute: php run_migrations.php\n";
    } else {
        echo "✅ Nenhum registro inconsistente encontrado.\n";
    }
    
} catch (PDOException $e) {
    die("❌ Erro: " . $e->getMessage() . "\n");
}

