<?php
/**
 * Script para executar migrations automaticamente - VERSÃO CORRIGIDA
 * Uso: php run_migrations_corrigido.php
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

// Carregar configurações do .env na raiz do projeto
$env_file = __DIR__ . '/../.env';
if (file_exists($env_file)) {
    $env = loadEnv($env_file);
    $db_host = $env['DB_HOST'] ?? 'localhost';
    $db_user = $env['DB_USER'] ?? 'root';
    $db_password = $env['DB_PASS'] ?? $env['DB_PASSWORD'] ?? '';
    $db_name = $env['DB_NAME'] ?? 'family_finance';
    $db_port = $env['DB_PORT'] ?? 3306;
} else {
    $db_host = 'localhost';
    $db_user = 'root';
    $db_password = '';
    $db_name = 'family_finance';
    $db_port = 3306;
    echo "⚠️  Arquivo .env não encontrado. Usando valores padrão.\n";
}

$migrations_dir = __DIR__ . '/migrations';

// Conectar ao banco
try {
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "✅ Conectado ao banco de dados: $db_name\n\n";
} catch (PDOException $e) {
    die("❌ Erro ao conectar: " . $e->getMessage() . "\n");
}

// Criar tabela de controle de migrations se não existir
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL UNIQUE,
            executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_migration_name (migration_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✅ Tabela de migrations criada/verificada\n\n";
} catch (PDOException $e) {
    die("❌ Erro ao criar tabela de migrations: " . $e->getMessage() . "\n");
}

// Buscar migrations já executadas
$executed = [];
$stmt = $pdo->query("SELECT migration_name FROM migrations");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $executed[] = $row['migration_name'];
}

// Buscar arquivos de migration
$migrations = [];
if (is_dir($migrations_dir)) {
    $files = scandir($migrations_dir);
    foreach ($files as $file) {
        if (preg_match('/^\d+_.+\.sql$/', $file)) {
            $migrations[] = $file;
        }
    }
    sort($migrations); // Ordenar numericamente
} else {
    die("❌ Diretório de migrations não encontrado: $migrations_dir\n");
}

// Executar migrations pendentes
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

    try {
        // Remover comandos USE (já estamos conectados)
        $sql = preg_replace('/^\s*USE\s+\w+\s*;/mi', '', $sql);
        
        // Remover comentários de linha (-- comentário)
        $sql = preg_replace('/^\s*--.*$/m', '', $sql);
        
        // Remover blocos de comentários (/* */)
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
        
        // Processar DELIMITER (para funções/procedures)
        if (strpos($sql, 'DELIMITER') !== false) {
            // Remover todas as linhas DELIMITER
            $sql = preg_replace('/^\s*DELIMITER\s+[^\s]+\s*$/mi', '', $sql);
            // Dividir por // (delimitador usado em funções)
            $statements = preg_split('/\s*\/\/\s*/', $sql);
            $statements = array_filter(array_map('trim', $statements), function($s) {
                return !empty($s);
            });
        } else {
            // Dividir por ponto e vírgula
            $parts = explode(';', $sql);
            $statements = [];
            foreach ($parts as $part) {
                $part = trim($part);
                // Remover comentários no final da linha
                $part = preg_replace('/\s*--.*$/m', '', $part);
                $part = trim($part);
                if (!empty($part)) {
                    $statements[] = $part;
                }
            }
        }
        
        if (empty($statements)) {
            echo "   ⚠️  Nenhum statement SQL encontrado no arquivo!\n";
            continue;
        }
        
        $pdo->beginTransaction();
        
        // Executar cada statement
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (empty($statement)) continue;
            
            try {
                $pdo->exec($statement);
            } catch (PDOException $stmtError) {
                $errorCode = $stmtError->getCode();
                $errorMsg = $stmtError->getMessage();
                
                // Ignorar apenas erros de índice duplicado
                if ($errorCode == 1061 || strpos($errorMsg, 'Duplicate key name') !== false) {
                    echo "   ⚠️  Aviso: " . $stmtError->getMessage() . "\n";
                    continue;
                }
                
                // Qualquer outro erro é crítico
                throw $stmtError;
            }
        }
        
        // Registrar migration como executada
        $stmt = $pdo->prepare("INSERT INTO migrations (migration_name) VALUES (?)");
        $stmt->execute([$migration]);
        
        $pdo->commit();
        echo "✅ Sucesso: $migration\n\n";
        $executed_count++;
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            try {
                $pdo->rollBack();
            } catch (PDOException $rollbackError) {
                // Ignorar erro de rollback
            }
        }
        echo "❌ Erro ao executar $migration: " . $e->getMessage() . "\n";
        echo "🛑 Parando execução\n";
        break;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            try {
                $pdo->rollBack();
            } catch (Exception $rollbackError) {
                // Ignorar erro de rollback
            }
        }
        echo "❌ Erro ao executar $migration: " . $e->getMessage() . "\n";
        echo "🛑 Parando execução\n";
        break;
    }
}

// Resumo
echo "\n" . str_repeat("=", 50) . "\n";
echo "📊 Resumo:\n";
echo "   Total de migrations: " . count($migrations) . "\n";
echo "   Já executadas: " . count($executed) . "\n";
echo "   Executadas agora: $executed_count\n";
echo "   Pendentes: " . (count($migrations) - count($executed) - $executed_count) . "\n";
echo str_repeat("=", 50) . "\n";

if ($executed_count > 0) {
    echo "✅ Migrations executadas com sucesso!\n";
} else {
    echo "ℹ️  Nenhuma migration pendente.\n";
}

