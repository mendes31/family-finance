<?php
/**
 * Script para executar migrations automaticamente - VERSÃO FINAL CORRIGIDA
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
    $pdo = new PDO($dsn, $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true  // Resolver problema de unbuffered queries
    ]);
    echo "✅ Conectado ao banco de dados: $db_name\n\n";
} catch (PDOException $e) {
    die("❌ Erro ao conectar: " . $e->getMessage() . "\n");
}

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_migration_name (migration_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✅ Tabela de migrations criada/verificada\n\n";
} catch (PDOException $e) {
    die("❌ Erro ao criar tabela de migrations: " . $e->getMessage() . "\n");
}

$executed = [];
$stmt = $pdo->query("SELECT migration_name FROM migrations");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $executed[] = $row['migration_name'];
}

$migrations_dir = __DIR__ . '/migrations';
$migrations = [];
if (is_dir($migrations_dir)) {
    $files = scandir($migrations_dir);
    foreach ($files as $file) {
        if (preg_match('/^\d+_.+\.sql$/', $file)) {
            $migrations[] = $file;
        }
    }
    sort($migrations);
} else {
    die("❌ Diretório de migrations não encontrado: $migrations_dir\n");
}

$executed_count = 0;
foreach ($migrations as $migration) {
    if (in_array($migration, $executed)) {
        echo "⏭️  Pulando: $migration (já executada)\n";
        continue;
    }

    $file_path = $migrations_dir . '/' . $migration;
    $sql = file_get_contents($file_path);
    if ($sql === false) {
        echo "❌ Erro ao ler arquivo: $migration\n";
        continue;
    }

    echo "🔄 Executando: $migration\n";

    // Remover USE
    $sql = preg_replace('/^\s*USE\s+\w+\s*;/mi', '', $sql);
    
    // Processar linha por linha
    $lines = explode("\n", $sql);
    $clean_sql = '';
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || preg_match('/^--/', $line)) continue;
        $line = preg_replace('/\s*--.*$/', '', $line);
        if (!empty($line)) {
            $clean_sql .= $line . "\n";
        }
    }
    
    // Dividir por ponto e vírgula
    $parts = explode(';', $clean_sql);
    $statements = [];
    foreach ($parts as $part) {
        $part = trim($part);
        if (!empty($part) && strlen($part) > 10) {
            $statements[] = $part;
        }
    }
    
    if (empty($statements)) {
        echo "   ⚠️  Nenhum statement SQL encontrado!\n";
        continue;
    }

    $rollback_done = false;
    try {
        $pdo->beginTransaction();
        
        foreach ($statements as $i => $statement) {
            $statement = trim($statement);
            if (empty($statement)) continue;
            
            try {
                $pdo->exec($statement);
            } catch (PDOException $stmtError) {
                $errorCode = $stmtError->getCode();
                $errorMsg = $stmtError->getMessage();
                
                // Ignorar apenas erros de índice duplicado
                if ($errorCode == 1061 || strpos($errorMsg, 'Duplicate key name') !== false) {
                    echo "   ⚠️  Aviso: " . $errorMsg . "\n";
                    continue;
                }
                
                // Qualquer outro erro - fazer rollback e relançar
                if (!$rollback_done && $pdo->inTransaction()) {
                    try {
                        $pdo->rollBack();
                        $rollback_done = true;
                    } catch (PDOException $rbError) {
                        // Ignorar erro de rollback
                    }
                }
                throw $stmtError;
            }
        }
        
        // Registrar migration como executada
        $stmt = $pdo->prepare("INSERT INTO migrations (migration_name) VALUES (?)");
        $stmt->execute([$migration]);
        
        if (!$rollback_done && $pdo->inTransaction()) {
            $pdo->commit();
        }
        echo "✅ Sucesso: $migration\n\n";
        $executed_count++;
        
    } catch (PDOException $e) {
        // Só fazer rollback se ainda não foi feito e houver transação ativa
        if (!$rollback_done && $pdo->inTransaction()) {
            try {
                $pdo->rollBack();
            } catch (PDOException $rbError) {
                // Ignorar erro de rollback
            }
        }
        echo "❌ Erro: " . $e->getMessage() . "\n";
        echo "   Código: " . $e->getCode() . "\n";
        echo "🛑 Parando execução\n";
        break;
    } catch (Exception $e) {
        if (!$rollback_done && $pdo->inTransaction()) {
            try {
                $pdo->rollBack();
            } catch (Exception $rbError) {
                // Ignorar
            }
        }
        echo "❌ Erro: " . $e->getMessage() . "\n";
        echo "🛑 Parando execução\n";
        break;
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "📊 Resumo:\n";
echo "   Total: " . count($migrations) . "\n";
echo "   Já executadas: " . count($executed) . "\n";
echo "   Executadas agora: $executed_count\n";
echo str_repeat("=", 50) . "\n";

if ($executed_count > 0) {
    echo "✅ Migrations executadas com sucesso!\n";
} else {
    echo "ℹ️  Nenhuma migration pendente.\n";
}

