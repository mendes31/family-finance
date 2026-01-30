<?php
/**
 * Script para atualizar o arquivo .env adicionando configurações faltantes
 * Uso: php atualizar_env.php
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

// Configurações que devem existir
$required_configs = [
    // Backend
    'API_PORT' => '3000',
    'JWT_SECRET' => 'seu_secret_super_seguro_aqui_altere_em_producao',
    'JWT_EXPIRES_IN' => '7d',
    'NODE_ENV' => 'development',
    'FRONTEND_URL' => 'http://localhost:8080',
    
    // Frontend
    'VITE_API_URL' => 'http://localhost:3000/api',
    'VITE_PORT' => '8080',
    
    // Supabase (manter se já existir, senão adicionar placeholder)
    'VITE_SUPABASE_PROJECT_ID' => 'dtmkgzgfnkfhtiilkubk',
    'VITE_SUPABASE_PUBLISHABLE_KEY' => 'SUA_CHAVE_AQUI',
    'VITE_SUPABASE_URL' => 'https://dtmkgzgfnkfhtiilkubk.supabase.co',
];

// Verificar quais configurações já existem
$missing_configs = [];
foreach ($required_configs as $key => $default_value) {
    if (!preg_match("/^$key=/m", $current_content)) {
        $missing_configs[$key] = $default_value;
    }
}

if (empty($missing_configs)) {
    echo "✅ O arquivo .env já está completo!\n";
    echo "   Todas as configurações necessárias já existem.\n";
    exit(0);
}

echo "📝 Configurações faltantes encontradas:\n";
foreach (array_keys($missing_configs) as $key) {
    echo "   - $key\n";
}
echo "\n";

// Preparar conteúdo para adicionar
$new_sections = [];

// Seção Backend
if (isset($missing_configs['API_PORT']) || isset($missing_configs['JWT_SECRET']) || 
    isset($missing_configs['JWT_EXPIRES_IN']) || isset($missing_configs['NODE_ENV']) || 
    isset($missing_configs['FRONTEND_URL'])) {
    $backend_section = "\n# ============================================\n";
    $backend_section .= "# BACKEND API (Node.js/Express - Futuro)\n";
    $backend_section .= "# ============================================\n";
    if (isset($missing_configs['API_PORT'])) {
        $backend_section .= "API_PORT=" . $missing_configs['API_PORT'] . "\n";
    }
    if (isset($missing_configs['JWT_SECRET'])) {
        $backend_section .= "JWT_SECRET=" . $missing_configs['JWT_SECRET'] . "\n";
    }
    if (isset($missing_configs['JWT_EXPIRES_IN'])) {
        $backend_section .= "JWT_EXPIRES_IN=" . $missing_configs['JWT_EXPIRES_IN'] . "\n";
    }
    if (isset($missing_configs['NODE_ENV'])) {
        $backend_section .= "NODE_ENV=" . $missing_configs['NODE_ENV'] . "\n";
    }
    if (isset($missing_configs['FRONTEND_URL'])) {
        $backend_section .= "FRONTEND_URL=" . $missing_configs['FRONTEND_URL'] . "\n";
    }
    $new_sections[] = $backend_section;
}

// Seção Frontend
if (isset($missing_configs['VITE_API_URL']) || isset($missing_configs['VITE_PORT'])) {
    $frontend_section = "\n# ============================================\n";
    $frontend_section .= "# FRONTEND (React/Vite)\n";
    $frontend_section .= "# ============================================\n";
    if (isset($missing_configs['VITE_API_URL'])) {
        $frontend_section .= "VITE_API_URL=" . $missing_configs['VITE_API_URL'] . "\n";
    }
    if (isset($missing_configs['VITE_PORT'])) {
        $frontend_section .= "VITE_PORT=" . $missing_configs['VITE_PORT'] . "\n";
    }
    $new_sections[] = $frontend_section;
}

// Seção Supabase
if (isset($missing_configs['VITE_SUPABASE_PROJECT_ID']) || 
    isset($missing_configs['VITE_SUPABASE_PUBLISHABLE_KEY']) || 
    isset($missing_configs['VITE_SUPABASE_URL'])) {
    $supabase_section = "\n# ============================================\n";
    $supabase_section .= "# SUPABASE (Legado - manter temporariamente durante migração)\n";
    $supabase_section .= "# ============================================\n";
    if (isset($missing_configs['VITE_SUPABASE_PROJECT_ID'])) {
        $supabase_section .= "VITE_SUPABASE_PROJECT_ID=" . $missing_configs['VITE_SUPABASE_PROJECT_ID'] . "\n";
    }
    if (isset($missing_configs['VITE_SUPABASE_PUBLISHABLE_KEY'])) {
        $supabase_section .= "VITE_SUPABASE_PUBLISHABLE_KEY=" . $missing_configs['VITE_SUPABASE_PUBLISHABLE_KEY'] . "\n";
    }
    if (isset($missing_configs['VITE_SUPABASE_URL'])) {
        $supabase_section .= "VITE_SUPABASE_URL=" . $missing_configs['VITE_SUPABASE_URL'] . "\n";
    }
    $new_sections[] = $supabase_section;
}

// Adicionar novas seções ao final do arquivo
$updated_content = rtrim($current_content) . "\n" . implode("", $new_sections) . "\n";

// Salvar arquivo atualizado
if (file_put_contents($env_file, $updated_content)) {
    echo "✅ Arquivo .env atualizado com sucesso!\n";
    echo "   Localização: $env_file\n\n";
    echo "📝 Configurações adicionadas:\n";
    foreach (array_keys($missing_configs) as $key) {
        echo "   ✅ $key\n";
    }
    echo "\n";
    echo "⚠️  IMPORTANTE:\n";
    echo "   - Verifique VITE_SUPABASE_PUBLISHABLE_KEY e complete com sua chave real\n";
    echo "   - Altere JWT_SECRET para um valor seguro em produção\n";
    echo "\n";
    echo "📖 Veja mais em: CONFIGURACAO_ENV.md\n";
} else {
    echo "❌ Erro ao atualizar o arquivo .env\n";
    echo "   Verifique as permissões da pasta.\n";
    exit(1);
}

