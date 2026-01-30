<?php
/**
 * Script para atualizar o arquivo .env seguindo o padrão especificado
 * Uso: php atualizar_env_padrao.php
 */

$env_file = __DIR__ . '/.env';

// Conteúdo completo do .env seguindo o padrão
$env_content = <<<'ENV'
# ============================================
# Family Finance Hub - Configurações de Ambiente
# ============================================

# Informações do projeto
APP_NAME=Family Finance Hub
APP_VERSION=1.0.0
APP_TIMEZONE=America/Sao_Paulo
APP_LOCALE=pt-BR
APP_LOGS=Sim
APP_ENV=development

# URL do projeto
# URL_ADM=http://localhost/family_finance/
# URL_ADM=http://192.168.3.94/family_finance/
URL_ADM=http://localhost/family_finance/

# E-mail do administrador
EMAIL_ADM=
EMAIL_TI=
NAME_EMAIL_TI=Suporte-FamilyFinance

# Credenciais do banco de dados
DB_HOST=localhost
DB_NAME=family_finance
DB_USER=root
DB_PASS=
DB_PORT=3306

# ============================================
# BACKEND API (Node.js/Express - Futuro)
# ============================================
API_PORT=3000
JWT_SECRET=seu_secret_super_seguro_aqui_altere_em_producao
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost/family_finance

# ============================================
# FRONTEND (React/Vite)
# ============================================
# URL da API Backend (será usado quando backend estiver pronto)
VITE_API_URL=http://localhost:3000/api
VITE_PORT=8080

# ============================================
# SUPABASE (Legado - manter temporariamente durante migração)
# ============================================
VITE_SUPABASE_PROJECT_ID=dtmkgzgfnkfhtiilkubk
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_AQUI
VITE_SUPABASE_URL=https://dtmkgzgfnkfhtiilkubk.supabase.co

# ============================================
# NOTAS:
# - DB_PASS: Deixe vazio se não tiver senha no MySQL
# - JWT_SECRET: Altere para um valor seguro em produção
# - VITE_SUPABASE_PUBLISHABLE_KEY: Complete com sua chave real
# ============================================
ENV;

// Criar/atualizar o arquivo (sobrescrever se existir)
if (file_put_contents($env_file, $env_content)) {
    echo "✅ Arquivo .env atualizado com sucesso!\n";
    echo "   Localização: $env_file\n\n";
    echo "📝 Configurações aplicadas seguindo o padrão:\n";
    echo "   ✅ Informações do projeto (APP_NAME, APP_VERSION, etc.)\n";
    echo "   ✅ URL do projeto (URL_ADM)\n";
    echo "   ✅ E-mail do administrador\n";
    echo "   ✅ Credenciais do banco de dados (DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT)\n";
    echo "   ✅ Configurações do backend e frontend\n";
    echo "\n";
    echo "⚠️  IMPORTANTE:\n";
    echo "   - Ajuste EMAIL_ADM e EMAIL_TI se necessário\n";
    echo "   - Complete VITE_SUPABASE_PUBLISHABLE_KEY com sua chave real\n";
    echo "   - Altere JWT_SECRET para um valor seguro em produção\n";
    echo "   - Ajuste URL_ADM se usar IP diferente (ex: http://192.168.x.x/family_finance/)\n";
    echo "\n";
    echo "📖 Veja mais em: CONFIGURACAO_ENV.md\n";
} else {
    echo "❌ Erro ao criar/atualizar o arquivo .env\n";
    echo "   Verifique as permissões da pasta.\n";
    exit(1);
}
