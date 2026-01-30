<?php
/**
 * Script para testar uma migration específica e ver o erro real
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
    
    echo "🔍 Testando criação da tabela profiles...\n\n";
    
    // Ler a migration
    $sql = file_get_contents(__DIR__ . '/migrations/003_create_profiles_table.sql');
    
    echo "📄 SQL original (primeiros 200 chars):\n";
    echo substr($sql, 0, 200) . "...\n\n";
    
    // Remover USE
    $sql = preg_replace('/^\s*USE\s+\w+\s*;/mi', '', $sql);
    
    echo "📄 SQL após remover USE:\n";
    echo substr($sql, 0, 200) . "...\n\n";
    
    // Dividir por ponto e vírgula
    $parts = explode(';', $sql);
    echo "📝 Partes encontradas ao dividir por ';': " . count($parts) . "\n";
    
    $statements = [];
    foreach ($parts as $i => $part) {
        $part = trim($part);
        echo "   Parte $i: " . (empty($part) ? "VAZIA" : substr($part, 0, 50)) . "\n";
        if (empty($part) || preg_match('/^--/', $part)) {
            continue;
        }
        // Remover comentários no final
        $part = preg_replace('/\s*--.*$/m', '', $part);
        $part = trim($part);
        if (!empty($part)) {
            $statements[] = $part;
        }
    }
    
    echo "\n📝 Statements válidos encontrados: " . count($statements) . "\n\n";
    
    foreach ($statements as $i => $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;
        
        echo "🔄 Executando statement " . ($i + 1) . ":\n";
        echo "   " . substr($statement, 0, 100) . "...\n";
        
        try {
            $pdo->beginTransaction();
            $pdo->exec($statement);
            $pdo->commit();
            echo "   ✅ Sucesso!\n\n";
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo "   ❌ ERRO: " . $e->getMessage() . "\n";
            echo "   Código: " . $e->getCode() . "\n\n";
        }
    }
    
    // Verificar se a tabela foi criada
    $stmt = $pdo->query("SHOW TABLES LIKE 'profiles'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "✅ Tabela 'profiles' foi criada!\n";
    } else {
        echo "❌ Tabela 'profiles' NÃO foi criada!\n";
    }
    
} catch (PDOException $e) {
    die("❌ Erro de conexão: " . $e->getMessage() . "\n");
}
