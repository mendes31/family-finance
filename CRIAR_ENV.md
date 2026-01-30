# 📝 Como Criar o Arquivo .env

## 🚀 Método 1: Script Automático (Recomendado)

Execute o script PHP na raiz do projeto:

```powershell
php criar_env.php
```

O script irá:
- ✅ Criar o arquivo `.env` automaticamente
- ✅ Incluir todas as configurações necessárias
- ✅ Perguntar antes de sobrescrever se já existir

---

## 🚀 Método 2: Criar Manualmente

### Passo 1: Criar o arquivo

Na raiz do projeto (`C:\wamp64\www\family_finance`), crie um arquivo chamado `.env`

### Passo 2: Copiar o conteúdo

Cole o seguinte conteúdo no arquivo:

```env
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
API_PORT=3000
JWT_SECRET=seu_secret_super_seguro_aqui_altere_em_producao
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# ============================================
# FRONTEND (React/Vite)
# ============================================
VITE_API_URL=http://localhost:3000/api
VITE_PORT=8080

# ============================================
# SUPABASE (Legado - manter temporariamente)
# ============================================
VITE_SUPABASE_PROJECT_ID=dtmkgzgfnkfhtiilkubk
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_AQUI
VITE_SUPABASE_URL=https://dtmkgzgfnkfhtiilkubk.supabase.co
```

### Passo 3: Ajustar configurações

Edite o arquivo e ajuste:
- `DB_PASSWORD` - Se tiver senha no MySQL
- `JWT_SECRET` - Altere para um valor seguro
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Complete com sua chave real do Supabase

---

## 🚀 Método 3: PowerShell (Windows)

Execute no PowerShell na raiz do projeto:

```powershell
@"
# BANCO DE DADOS
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=family_finance

# BACKEND
API_PORT=3000
JWT_SECRET=seu_secret_super_seguro_aqui_altere_em_producao
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# FRONTEND
VITE_API_URL=http://localhost:3000/api
VITE_PORT=8080

# SUPABASE
VITE_SUPABASE_PROJECT_ID=dtmkgzgfnkfhtiilkubk
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_AQUI
VITE_SUPABASE_URL=https://dtmkgzgfnkfhtiilkubk.supabase.co
"@ | Out-File -FilePath .env -Encoding utf8
```

Depois edite o arquivo para completar as configurações.

---

## ✅ Verificar se Funcionou

Após criar o arquivo, verifique:

1. O arquivo `.env` existe na raiz do projeto
2. Execute os scripts PHP:
   ```powershell
   cd database
   php run_migrations.php
   ```
   Se não aparecer aviso sobre `.env não encontrado`, está funcionando!

---

## 📖 Mais Informações

- **Documentação completa**: `CONFIGURACAO_ENV.md`
- **Template**: Use o conteúdo acima como base

---

**Última atualização**: 2026-01-05

