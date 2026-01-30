# ⚙️ Configuração do Arquivo .env

## 📋 Visão Geral

O projeto usa um **único arquivo `.env` na raiz** para todas as configurações (frontend, backend e banco de dados).

---

## 🚀 Configuração Inicial

### 1. Criar o Arquivo .env

1. **Copie o arquivo de exemplo:**
   ```powershell
   # Na raiz do projeto
   copy .env.example .env
   ```

2. **Ou crie manualmente:**
   - Crie um arquivo chamado `.env` na raiz do projeto
   - Copie o conteúdo de `.env.example`

### 2. Ajustar as Configurações

Edite o arquivo `.env` com suas configurações:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=family_finance

# Backend
API_PORT=3000
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_PORT=8080
```

---

## 📝 Seções do .env

### 🔹 Informações do Projeto

```env
APP_NAME=Family Finance Hub    # Nome da aplicação
APP_VERSION=1.0.0              # Versão
APP_TIMEZONE=America/Sao_Paulo # Timezone
APP_LOCALE=pt-BR               # Idioma
APP_LOGS=Sim                   # Habilitar logs
APP_ENV=development            # Ambiente
```

### 🔹 URL do Projeto

```env
URL_ADM=http://localhost/family_finance/  # URL principal
```

**Nota**: Você pode comentar/descomentar diferentes URLs conforme necessário.

### 🔹 E-mail do Administrador

```env
EMAIL_ADM=                    # E-mail do administrador
EMAIL_TI=                     # E-mail de suporte TI
NAME_EMAIL_TI=Suporte-FamilyFinance  # Nome do remetente
```

### 🔹 Banco de Dados (MySQL)

```env
DB_HOST=localhost          # Host do MySQL
DB_NAME=family_finance     # Nome do banco de dados
DB_USER=root               # Usuário do MySQL
DB_PASS=                   # Senha (deixe vazio se não tiver)
DB_PORT=3306               # Porta do MySQL
```

**Nota**: O script também aceita `DB_PASSWORD` (compatibilidade), mas o padrão é `DB_PASS`.

**Usado por:**
- Scripts PHP de migrations (`database/run_migrations.php`)
- Scripts PHP de seeds (`database/run_seeds.php`)
- Backend API (futuro)

**Variáveis:**
- `DB_HOST`: Host do MySQL (padrão: localhost)
- `DB_NAME`: Nome do banco (padrão: family_finance)
- `DB_USER`: Usuário (padrão: root)
- `DB_PASS`: Senha (deixe vazio se não tiver)
- `DB_PORT`: Porta (padrão: 3306)

### 🔹 Backend API

```env
API_PORT=3000              # Porta do servidor backend
JWT_SECRET=...             # Chave secreta para JWT (altere em produção!)
JWT_EXPIRES_IN=7d          # Tempo de expiração do token
NODE_ENV=development       # Ambiente (development/production)
```

**Usado por:**
- Backend Node.js/Express (futuro)

### 🔹 Frontend

```env
VITE_API_URL=http://localhost:3000/api  # URL da API backend
VITE_PORT=8080                          # Porta do Vite dev server
```

**Usado por:**
- Frontend React/Vite
- Acessível via `import.meta.env.VITE_API_URL`

---

## 🔄 Migração do Supabase

### Configurações Antigas (Supabase)

Se você ainda tem configurações do Supabase no `.env`:

```env
# Estas serão removidas após migração completa
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
```

**Ação**: Você pode mantê-las temporariamente ou removê-las quando o backend estiver pronto.

---

## ✅ Validação

### Verificar se o .env está sendo lido:

**Scripts PHP:**
```powershell
cd database
php run_migrations.php
# Se aparecer aviso sobre .env não encontrado, verifique o caminho
```

**Frontend (Vite):**
- As variáveis `VITE_*` são automaticamente carregadas pelo Vite
- Acesse via: `import.meta.env.VITE_API_URL`

**Backend (futuro):**
- Usará `dotenv` para carregar: `require('dotenv').config()`

---

## 🔐 Segurança

### ⚠️ IMPORTANTE

1. **NUNCA commite o arquivo `.env`** no Git
2. O arquivo está no `.gitignore`
3. **Sempre use `.env.example`** como template
4. **Altere `JWT_SECRET`** em produção para um valor seguro

### Valores Sensíveis

- `DB_PASSWORD` - Senha do MySQL
- `JWT_SECRET` - Chave secreta para tokens
- Credenciais do Supabase (se ainda estiver usando)

---

## 📚 Estrutura de Arquivos

```
family_finance/
├── .env                    # ⚠️ NÃO commitar (contém senhas)
├── .env.example            # ✅ Template (pode commitar)
├── database/
│   ├── run_migrations.php  # Lê .env da raiz
│   └── run_seeds.php       # Lê .env da raiz
├── src/                    # Frontend (usa VITE_*)
└── backend/                # Backend futuro (usará todas as vars)
```

---

## 🛠️ Troubleshooting

### Erro: "Arquivo .env não encontrado"

**Solução**: 
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Verifique se está no caminho correto: `C:\wamp64\www\family_finance\.env`

### Variáveis não estão sendo lidas

**Frontend (Vite):**
- Variáveis devem começar com `VITE_`
- Reinicie o servidor Vite após alterar `.env`

**Scripts PHP:**
- Verifique se o caminho está correto: `__DIR__ . '/../.env'`
- Verifique permissões do arquivo

**Backend (futuro):**
- Certifique-se de usar `dotenv`: `require('dotenv').config()`
- Verifique se o arquivo está na raiz do projeto

---

## 📖 Referências

- **Template**: `.env.example`
- **Documentação do Vite**: https://vitejs.dev/guide/env-and-mode.html
- **Documentação dotenv**: https://www.npmjs.com/package/dotenv

---

**Última atualização**: 2026-01-05

