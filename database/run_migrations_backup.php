<?php
/**
 * Script para executar migrations automaticamente
 * Uso: php run_migrations.php
 */

// Função para ler arquivo .env
function loadEnv($file) {
    $env = [];
    if (!file_exists($file)) {
        return $env;
    }
    
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorar comentários
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Separar chave e valor
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Remover aspas se houver
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
    // Valores padrão se .env não existir
    $db_host = 'localhost';
    $db_user = 'root';
    $db_password = '';
    $db_name = 'family_finance';
    $db_port = 3306;
    echo "⚠️  Arquivo .env não encontrado. Usando valores padrão.\n";
    echo "   Crie um arquivo .env na raiz do projeto baseado em .env.example\n\n";
}

$migrations_dir = __DIR__ . '/migrations';

// Conectar ao banco
try {
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    $pdo = new PDO(
        $dsn,
        $db_user,
        $db_password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
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

    // Remover comandos USE database (já estamos conectados ao banco correto)
    $sql = preg_replace('/^\s*USE\s+\w+\s*;/mi', '', $sql);
    
    // Processar DELIMITER (comando do cliente MySQL, não funciona com PDO)
    // Remover DELIMITER e usar ; como separador padrão
    $sql = preg_replace('/^\s*DELIMITER\s+[^\s]+\s*$/mi', '', $sql);
    
    // Dividir por DELIMITER customizado (//) ou por ponto e vírgula
    if (strpos($sql, '//') !== false) {
        // Processar blocos delimitados por //
        $blocks = preg_split('/\s*\/\/\s*/', $sql);
        $statements = [];
        foreach ($blocks as $block) {
            $block = trim($block);
            if (empty($block) || preg_match('/^--/', $block)) {
                continue;
            }
            // Remover DELIMITER ; no final
            $block = preg_replace('/^\s*DELIMITER\s*;\s*$/mi', '', $block);
            if (!empty(trim($block))) {
                $statements[] = $block;
            }
        }
    } else {
        // Dividir em múltiplos statements por ponto e vírgula
        // IMPORTANTE: Não filtrar statements vazios no final, pois podem ser válidos
        $parts = explode(';', $sql);
        $statements = [];
        foreach ($parts as $part) {
            $part = trim($part);
            // Ignorar apenas comentários e strings completamente vazias
            if (empty($part) || preg_match('/^--/', $part)) {
                continue;
            }
            // Remover comentários no final da linha
            $part = preg_replace('/\s*--.*$/m', '', $part);
            $part = trim($part);
            if (!empty($part)) {
                $statements[] = $part;
            }
        }
    }

    echo "🔄 Executando: $migration\n";

    try {
        $pdo->beginTransaction();
        
        // Executar cada statement separadamente
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                try {
                    $pdo->exec($statement);
                } catch (PDOException $stmtError) {
                    $errorMsg = $stmtError->getMessage();
                    $errorCode = $stmtError->getCode();
                    
                    // Ignorar apenas erros específicos e não críticos
                    // 1061 = Duplicate key name (índice já existe)
                    // 1050 = Table already exists (tabela já existe - mas isso não deveria acontecer com IF NOT EXISTS)
                    if ($errorCode == 1061 || 
                        (strpos($errorMsg, 'Duplicate key name') !== false)) {
                        // Índice já existe, apenas avisar
                        echo "   ⚠️  Aviso: " . $stmtError->getMessage() . "\n";
                        continue;
                    }
                    
                    // Qualquer outro erro é crítico e deve parar a execução
                    echo "   ❌ Erro crítico no statement:\n";
                    echo "      " . substr($statement, 0, 100) . "...\n";
                    throw $stmtError;
                }
            }
        }
        
        // Registrar migration como executada
        $stmt = $pdo->prepare("INSERT INTO migrations (migration_name) VALUES (?)");
        $stmt->execute([$migration]);
        
        $pdo->commit();
        echo "✅ Sucesso: $migration\n\n";
        $executed_count++;
    } catch (PDOException $e) {
        // Só fazer rollback se houver transação ativa
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
        // Capturar outros tipos de erro
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

