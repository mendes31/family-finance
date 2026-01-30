# 🚀 Plano de Desenvolvimento - Family Finance Hub

## 📋 Visão Geral

Este documento apresenta um plano detalhado para continuar o desenvolvimento do Family Finance Hub, incluindo a migração do Supabase para MySQL local (phpMyAdmin) e preparação para hospedagem futura.

---

## 🎯 Objetivos

1. **Migrar do Supabase para MySQL local** (phpMyAdmin)
2. **Desenvolver backend API** (Node.js/Express ou PHP)
3. **Refatorar frontend** para usar API REST
4. **Configurar ambiente local** completo
5. **Preparar para hospedagem** futura

---

## 📅 Fases de Desenvolvimento

### **FASE 1: Configuração do Ambiente Local** ⏱️ 2-3 horas

#### 1.1 Verificar WAMP
- [ ] Verificar se WAMP está instalado e funcionando
- [ ] Verificar se MySQL está rodando
- [ ] Verificar se phpMyAdmin está acessível (http://localhost/phpmyadmin)
- [ ] Anotar credenciais do MySQL (usuário padrão: `root`, senha: geralmente vazia)

#### 1.2 Criar Banco de Dados no phpMyAdmin

**Passo a passo:**

1. Acesse o phpMyAdmin: `http://localhost/phpmyadmin`
2. Clique na aba **"SQL"** no topo
3. Execute o seguinte comando:

```sql
CREATE DATABASE family_finance 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

4. Ou use a interface:
   - Clique em **"Novo"** no menu lateral
   - Nome do banco: `family_finance`
   - Collation: `utf8mb4_unicode_ci`
   - Clique em **"Criar"**

5. Selecione o banco `family_finance` no menu lateral

#### 1.3 Criar Usuário do Banco (Opcional, mas recomendado)

```sql
-- Criar usuário específico para o projeto
CREATE USER 'family_finance_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';

-- Dar permissões
GRANT ALL PRIVILEGES ON family_finance.* TO 'family_finance_user'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;
```

**Nota**: Se preferir usar o usuário `root`, pode pular este passo.

---

### **FASE 2: Migração do Schema PostgreSQL → MySQL** ⏱️ 4-6 horas

#### 2.1 Decisões Importantes

**UUID vs AUTO_INCREMENT:**
- ✅ **Recomendação**: Manter UUIDs (CHAR(36)) para facilitar migração futura
- Alternativa: Usar AUTO_INCREMENT (INT) se preferir simplicidade

**Escolha da Tecnologia Backend:**
- **Opção A**: Node.js + Express (recomendado para desenvolvedores JavaScript)
- **Opção B**: PHP (recomendado para WAMP, mais fácil de hospedar)

**Decisão**: Vamos usar **Node.js + Express** (mais moderno e mantém stack JavaScript)

#### 2.2 Criar Script SQL para MySQL

Criar arquivo: `database/schema.sql`

**Conversões necessárias:**
- `UUID` → `CHAR(36)` ou `VARCHAR(36)`
- `TEXT` → `TEXT` ou `VARCHAR(255)` (conforme necessário)
- `TIMESTAMPTZ` → `DATETIME` ou `TIMESTAMP`
- `DECIMAL(15,2)` → `DECIMAL(15,2)` (compatível)
- `ENUM` → `ENUM` (sintaxe diferente)
- `gen_random_uuid()` → `UUID()` (função MySQL) ou usar UUIDs no backend

#### 2.3 Executar Schema no phpMyAdmin

1. Abra o phpMyAdmin
2. Selecione o banco `family_finance`
3. Clique na aba **"SQL"**
4. Cole o conteúdo do arquivo `database/schema.sql`
5. Clique em **"Executar"**
6. Verifique se todas as tabelas foram criadas

#### 2.4 Criar Dados Iniciais

- Categorias padrão
- Usuário admin de teste (opcional)

---

### **FASE 3: Desenvolvimento do Backend API** ⏱️ 8-12 horas

#### 3.1 Estrutura do Backend (Node.js + Express)

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração MySQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   ├── creditCardController.js
│   │   ├── categoryController.js
│   │   ├── familyController.js
│   │   └── profileController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── errorHandler.js
│   ├── models/
│   │   └── [modelos se necessário]
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── creditCards.js
│   │   ├── categories.js
│   │   ├── families.js
│   │   └── profile.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   └── uuid.js
│   └── app.js                   # Express app
├── uploads/                     # Pasta para anexos
├── .env                         # Variáveis de ambiente
└── package.json
```

#### 3.2 Instalação de Dependências

```bash
cd backend
npm init -y
npm install express mysql2 bcrypt jsonwebtoken cors dotenv multer
npm install -D nodemon
```

#### 3.3 Configuração do Banco de Dados

**Arquivo: `backend/src/config/database.js`**

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'family_finance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

**Arquivo: `backend/.env`**

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=family_finance

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:8080
```

#### 3.4 Endpoints da API

**Autenticação:**
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/refresh` - Refresh token

**Famílias:**
- `GET /api/families` - Listar famílias do usuário
- `POST /api/families` - Criar família
- `GET /api/families/:id` - Detalhes
- `PUT /api/families/:id` - Atualizar
- `DELETE /api/families/:id` - Deletar

**Transações:**
- `GET /api/transactions` - Listar (com filtros)
- `POST /api/transactions` - Criar
- `GET /api/transactions/:id` - Detalhes
- `PUT /api/transactions/:id` - Atualizar
- `DELETE /api/transactions/:id` - Deletar

**Cartões:**
- `GET /api/credit-cards` - Listar
- `POST /api/credit-cards` - Criar
- `PUT /api/credit-cards/:id` - Atualizar
- `DELETE /api/credit-cards/:id` - Deletar

**Categorias:**
- `GET /api/categories` - Listar
- `POST /api/categories` - Criar

**Perfil:**
- `GET /api/profile` - Obter perfil
- `PUT /api/profile` - Atualizar perfil

**Dashboard:**
- `GET /api/dashboard/summary` - Resumo financeiro

#### 3.5 Autenticação JWT

- Usar `jsonwebtoken` para criar tokens
- Usar `bcrypt` para hash de senhas
- Middleware de autenticação para proteger rotas
- Refresh tokens para renovação automática

#### 3.6 Autorização

- Verificar se usuário pertence à família
- Verificar roles (user/admin)
- Validar ownership de recursos

#### 3.7 Upload de Arquivos

- Usar `multer` para upload
- Salvar em `backend/uploads/`
- Retornar URL relativa ou absoluta

---

### **FASE 4: Refatoração do Frontend** ⏱️ 6-8 horas

#### 4.1 Remover Dependências do Supabase

```bash
npm uninstall @supabase/supabase-js
```

Remover:
- `src/integrations/supabase/`
- Referências ao Supabase no código

#### 4.2 Criar Cliente HTTP

**Arquivo: `src/lib/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, fazer logout
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### 4.3 Atualizar Hooks

Refatorar todos os hooks para usar a API REST:

- `useAuth.tsx` - Usar `/api/auth/*`
- `useTransactions.tsx` - Usar `/api/transactions`
- `useCreditCards.tsx` - Usar `/api/credit-cards`
- `useCategories.tsx` - Usar `/api/categories`
- `useFamily.tsx` - Usar `/api/families`
- `useProfile.tsx` - Usar `/api/profile`

#### 4.4 Variáveis de Ambiente

**Arquivo: `.env`**

```env
VITE_API_URL=http://localhost:3000/api
```

**Arquivo: `.env.example`**

```env
VITE_API_URL=http://localhost:3000/api
```

---

### **FASE 5: Testes e Validação** ⏱️ 4-6 horas

#### 5.1 Testes Funcionais

- [ ] Registro e login
- [ ] Criação de família
- [ ] CRUD de transações
- [ ] CRUD de cartões
- [ ] CRUD de categorias
- [ ] Upload de anexos
- [ ] Permissões (user vs admin)
- [ ] Filtros e buscas

#### 5.2 Testes de Performance

- [ ] Queries lentas
- [ ] Otimização de índices
- [ ] Cache de queries (TanStack Query)

#### 5.3 Correção de Bugs

- [ ] Corrigir erros encontrados
- [ ] Melhorar tratamento de erros
- [ ] Validações no backend

---

### **FASE 6: Documentação e Preparação** ⏱️ 2-4 horas

#### 6.1 Documentação Técnica

- [ ] Documentar API (endpoints, parâmetros, respostas)
- [ ] Documentar schema do banco
- [ ] Atualizar README.md
- [ ] Guia de instalação local

#### 6.2 Scripts Úteis

- [ ] Script de backup do banco
- [ ] Script de seed (dados iniciais)
- [ ] Script de migração (se necessário)

---

### **FASE 7: Preparação para Hospedagem** ⏱️ 4-6 horas

#### 7.1 Configurações de Produção

- [ ] Variáveis de ambiente de produção
- [ ] Configuração de CORS
- [ ] Configuração de HTTPS
- [ ] Backup automático do banco
- [ ] Logs e monitoramento

#### 7.2 Build e Deploy

**Frontend:**
```bash
npm run build
# Upload da pasta dist/ para hospedagem
```

**Backend:**
- Configurar servidor Node.js (PM2, systemd, etc.)
- Configurar banco MySQL na hospedagem
- Configurar domínio e SSL

#### 7.3 Opções de Hospedagem

**Frontend:**
- Netlify, Vercel, GitHub Pages (gratuito)
- cPanel (hospedagem compartilhada)
- VPS (controle total)

**Backend:**
- VPS (Node.js)
- cPanel (PHP, se escolher PHP)
- Railway, Render (PaaS)

**Banco de Dados:**
- MySQL na mesma hospedagem
- MySQL remoto (ex: PlanetScale, AWS RDS)

---

## 🛠️ Ferramentas e Bibliotecas Necessárias

### Backend (Node.js)
- `express` - Framework web
- `mysql2` - Cliente MySQL
- `bcrypt` - Hash de senhas
- `jsonwebtoken` - JWT tokens
- `cors` - CORS middleware
- `dotenv` - Variáveis de ambiente
- `multer` - Upload de arquivos

### Frontend
- `axios` - Cliente HTTP (ou usar fetch nativo)
- Manter todas as dependências atuais

---

## 📝 Checklist de Desenvolvimento

### Setup Inicial
- [ ] WAMP instalado e funcionando
- [ ] Banco MySQL criado no phpMyAdmin
- [ ] Schema SQL executado com sucesso
- [ ] Backend Node.js configurado
- [ ] Frontend configurado para usar API

### Funcionalidades Core
- [ ] Autenticação (registro, login, logout)
- [ ] CRUD de transações
- [ ] CRUD de cartões
- [ ] CRUD de categorias
- [ ] Gerenciamento de famílias
- [ ] Dashboard com estatísticas
- [ ] Upload de anexos

### Segurança
- [ ] Hash de senhas (bcrypt)
- [ ] JWT tokens
- [ ] Autorização (roles, família)
- [ ] Validação de dados (backend)
- [ ] CORS configurado

### Testes
- [ ] Testes funcionais
- [ ] Testes de performance
- [ ] Correção de bugs

### Documentação
- [ ] README atualizado
- [ ] Documentação da API
- [ ] Guia de instalação

### Deploy
- [ ] Build de produção
- [ ] Configurações de produção
- [ ] Deploy do frontend
- [ ] Deploy do backend
- [ ] Banco MySQL na hospedagem

---

## ⚠️ Pontos de Atenção

1. **UUID vs AUTO_INCREMENT**: Decidir antes de começar
2. **Autenticação**: Implementar segurança robusta (não confiar apenas no frontend)
3. **Autorização**: Verificar permissões no backend (não apenas no frontend)
4. **Validação**: Validar todos os dados no backend
5. **Uploads**: Configurar limites de tamanho e tipos de arquivo
6. **Backup**: Configurar backup automático do banco
7. **Timezones**: Ajustar timestamps conforme necessário
8. **CORS**: Configurar corretamente para produção

---

## 📅 Estimativa de Tempo Total

- **Fase 1**: 2-3 horas
- **Fase 2**: 4-6 horas
- **Fase 3**: 8-12 horas
- **Fase 4**: 6-8 horas
- **Fase 5**: 4-6 horas
- **Fase 6**: 2-4 horas
- **Fase 7**: 4-6 horas

**Total**: 30-45 horas de desenvolvimento

---

## 🎯 Próximos Passos Imediatos

1. ✅ **Análise completa do projeto** (concluído)
2. ✅ **Plano de desenvolvimento** (este documento)
3. ⬜ **Criar banco MySQL no phpMyAdmin** (Fase 1)
4. ⬜ **Criar schema SQL para MySQL** (Fase 2)
5. ⬜ **Iniciar desenvolvimento do backend** (Fase 3)

---

## 📚 Recursos Úteis

- [Documentação MySQL](https://dev.mysql.com/doc/)
- [Documentação Express](https://expressjs.com/)
- [Documentação JWT](https://jwt.io/)
- [Documentação bcrypt](https://www.npmjs.com/package/bcrypt)
- [Documentação Axios](https://axios-http.com/)

---

**Última atualização**: 30 de dezembro de 2024

