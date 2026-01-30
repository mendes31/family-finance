<?php
/**
 * Script para atualizar o arquivo .env com configurações finais
 * Uso: php atualizar_env_final.php
 */

$env_file = __DIR__ . '/.env';

// Verificar se o arquivo existe
if (!file_exists($env_file)) {
    echo "❌ Arquivo .env não encontrado!\n";
    echo "   Execute primeiro: php criar_env.php\n";
    exit(1);
}

// Ler conteúdo atual
$current_content = file_get_contents($env_file);

// Atualizar FRONTEND_URL para URL amigável
$current_content = preg_replace(
    '/^FRONTEND_URL=.*$/m',
    'FRONTEND_URL=http://localhost/family_finance',
    $current_content
);

// Adicionar comentários explicativos se não existirem
$updates = [];

// Verificar se precisa adicionar comentário sobre URLs
if (!preg_match('/# URLs da aplicação/i', $current_content)) {
    $updates[] = "\n# ============================================\n";
    $updates[] = "# URLs da Aplicação\n";
    $updates[] = "# ============================================\n";
    $updates[] = "# BASE_URL: URL base da aplicação (sem porta)\n";
    $updates[] = "BASE_URL=http://localhost/family_finance\n";
}

// Adicionar seção de URLs se não existir
if (!preg_match('/^BASE_URL=/m', $current_content)) {
    // Inserir após FRONTEND_URL
    $current_content = preg_replace(
        '/(FRONTEND_URL=.*\n)/',
        "$1BASE_URL=http://localhost/family_finance\n",
        $current_content
    );
}

// Atualizar comentários do FRONTEND_URL
$current_content = preg_replace(
    '/(FRONTEND_URL=.*\n)/',
    "# URL do frontend (Apache - sem porta)\n$1",
    $current_content
);

// Atualizar comentários do VITE_API_URL
if (preg_match('/^VITE_API_URL=/m', $current_content)) {
    $current_content = preg_replace(
        '/(^VITE_API_URL=.*$)/m',
        "# URL da API Backend (será usado quando backend estiver pronto)\n$1",
        $current_content
    );
}

// Salvar arquivo atualizado
if (file_put_contents($env_file, $current_content)) {
    echo "✅ Arquivo .env atualizado com sucesso!\n";
    echo "   Localização: $env_file\n\n";
    echo "📝 Configurações atualizadas:\n";
    echo "   ✅ FRONTEND_URL=http://localhost/family_finance\n";
    echo "   ✅ BASE_URL=http://localhost/family_finance\n";
    echo "\n";
    echo "📖 Veja mais em: CONFIGURACAO_ENV.md\n";
} else {
    echo "❌ Erro ao atualizar o arquivo .env\n";
    echo "   Verifique as permissões da pasta.\n";
    exit(1);
}

