<?php
/**
 * Script para verificar quais migrations foram executadas
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
    
    $stmt = $pdo->query("SELECT migration_name, executed_at FROM migrations ORDER BY executed_at");
    $migrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📋 Migrations registradas como executadas: " . count($migrations) . "\n\n";
    
    foreach ($migrations as $migration) {
        echo "   ✅ " . $migration['migration_name'] . " - " . $migration['executed_at'] . "\n";
    }
    
    // Verificar quais tabelas deveriam ter sido criadas
    echo "\n🔍 Verificando tabelas esperadas:\n";
    $expected = [
        '001_create_users_table.sql' => ['users'],
        '002_create_families_table.sql' => ['families'],
        '003_create_profiles_table.sql' => ['profiles'],
        '004_create_user_roles_table.sql' => ['user_roles'],
        '005_create_family_members_table.sql' => ['family_members'],
        '006_create_categories_table.sql' => ['categories'],
        '007_create_credit_cards_table.sql' => ['credit_cards'],
        '008_create_transactions_table.sql' => ['transactions'],
        '009_create_budgets_table.sql' => ['budgets'],
        '010_create_financial_goals_table.sql' => ['financial_goals'],
        '011_create_alerts_table.sql' => ['alerts'],
    ];
    
    $stmt = $pdo->query("SHOW TABLES");
    $existing_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($expected as $migration => $tables) {
        $migration_executed = false;
        foreach ($migrations as $m) {
            if ($m['migration_name'] === $migration) {
                $migration_executed = true;
                break;
            }
        }
        
        if ($migration_executed) {
            foreach ($tables as $table) {
                if (in_array($table, $existing_tables)) {
                    echo "   ✅ $migration -> tabela '$table' existe\n";
                } else {
                    echo "   ❌ $migration -> tabela '$table' NÃO existe (migration marcada como executada mas tabela não foi criada!)\n";
                }
            }
        } else {
            echo "   ⏭️  $migration -> não executada\n";
        }
    }
    
} catch (PDOException $e) {
    die("❌ Erro: " . $e->getMessage() . "\n");
}

