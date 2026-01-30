<?php
/**
 * Script para criar o arquivo .env automaticamente
 * Uso: php criar_env.php
 */

$env_content = <<<'ENV'
# ============================================
# Family Finance Hub - Configurações de Ambiente
# ============================================
# ⚠️ IMPORTANTE: Este arquivo contém informações sensíveis
# NÃO commite este arquivo no Git!

# ============================================
# BANCO DE DADOS (MySQL)
# ============================================
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=family_finance

# ============================================
# BACKEND API (Node.js/Express - Futuro)
# ============================================
# Porta do servidor backend
API_PORT=3000

# JWT - Token de autenticação
# ⚠️ ALTERE este valor em produção para um secret seguro!
JWT_SECRET=seu_secret_super_seguro_aqui_altere_em_producao
JWT_EXPIRES_IN=7d

# Ambiente
NODE_ENV=development

# CORS - URL do frontend
FRONTEND_URL=http://localhost:8080

# ============================================
# FRONTEND (React/Vite)
# ============================================
# URL da API Backend (será usado quando backend estiver pronto)
VITE_API_URL=http://localhost:3000/api

# Porta do servidor de desenvolvimento (Vite)
VITE_PORT=8080

# ============================================
# SUPABASE (Legado - manter temporariamente durante migração)
# ============================================
# Estas configurações serão removidas após migração completa para MySQL
# Mantenha-as por enquanto para o frontend continuar funcionando
VITE_SUPABASE_PROJECT_ID=dtmkgzgfnkfhtiilkubk
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bWtnemdmbmtmaHRpaWxrdWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MTI4MDAsImV4cCI6MjA1MTE4ODgwMH0.placeholder_key_here
VITE_SUPABASE_URL=https://dtmkgzgfnkfhtiilkubk.supabase.co

# ============================================
# NOTAS:
# - DB_PASSWORD: Deixe vazio se não tiver senha no MySQL
# - JWT_SECRET: Altere para um valor seguro em produção
# - VITE_API_URL: URL do backend API (será usado no futuro)
# - Configurações do Supabase: Manter temporariamente durante migração
# ============================================
ENV;

$env_file = __DIR__ . '/.env';

// Verificar se o arquivo já existe
if (file_exists($env_file)) {
    echo "⚠️  O arquivo .env já existe!\n";
    echo "   Localização: $env_file\n";
    echo "   Deseja sobrescrever? (s/n): ";
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    $response = trim(strtolower($line));
    fclose($handle);
    
    if ($response !== 's' && $response !== 'sim' && $response !== 'y' && $response !== 'yes') {
        echo "❌ Operação cancelada.\n";
        exit(0);
    }
}

// Criar o arquivo
if (file_put_contents($env_file, $env_content)) {
    echo "✅ Arquivo .env criado com sucesso!\n";
    echo "   Localização: $env_file\n\n";
    echo "📝 Próximos passos:\n";
    echo "   1. Edite o arquivo .env e ajuste as configurações se necessário\n";
    echo "   2. Especialmente verifique:\n";
    echo "      - DB_PASSWORD (se tiver senha no MySQL)\n";
    echo "      - JWT_SECRET (altere para um valor seguro)\n";
    echo "      - VITE_SUPABASE_PUBLISHABLE_KEY (complete com a chave real)\n";
    echo "\n";
    echo "📖 Veja mais em: CONFIGURACAO_ENV.md\n";
} else {
    echo "❌ Erro ao criar o arquivo .env\n";
    echo "   Verifique as permissões da pasta.\n";
    exit(1);
}

