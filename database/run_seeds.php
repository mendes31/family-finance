<?php
/**
 * Script para executar seeds automaticamente
 * Uso: php run_seeds.php
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

$seeds_dir = __DIR__ . '/seeds';

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

// Buscar arquivos de seed
$seeds = [];
if (is_dir($seeds_dir)) {
    $files = scandir($seeds_dir);
    foreach ($files as $file) {
        if (preg_match('/^\d+_.+\.sql$/', $file)) {
            $seeds[] = $file;
        }
    }
    sort($seeds); // Ordenar numericamente
} else {
    die("❌ Diretório de seeds não encontrado: $seeds_dir\n");
}

if (empty($seeds)) {
    echo "ℹ️  Nenhum seed encontrado.\n";
    exit(0);
}

// Executar seeds
$executed_count = 0;
foreach ($seeds as $seed) {
    $file_path = $seeds_dir . '/' . $seed;
    $sql = file_get_contents($file_path);

    if ($sql === false) {
        echo "❌ Erro ao ler arquivo: $seed\n";
        continue;
    }

    echo "🌱 Executando: $seed\n";

    try {
        $pdo->beginTransaction();
        $pdo->exec($sql);
        $pdo->commit();
        echo "✅ Sucesso: $seed\n\n";
        $executed_count++;
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo "❌ Erro ao executar $seed: " . $e->getMessage() . "\n";
        echo "⚠️  Continuando com próximo seed...\n\n";
    }
}

// Resumo
echo "\n" . str_repeat("=", 50) . "\n";
echo "📊 Resumo:\n";
echo "   Total de seeds: " . count($seeds) . "\n";
echo "   Executados: $executed_count\n";
echo str_repeat("=", 50) . "\n";

if ($executed_count > 0) {
    echo "✅ Seeds executados com sucesso!\n";
} else {
    echo "❌ Nenhum seed foi executado.\n";
}

