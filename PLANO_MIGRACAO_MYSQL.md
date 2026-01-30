# Plano de Migração: Supabase → MySQL/phpMyAdmin Local

## 🎯 Objetivo

Migrar o projeto **Family Finance Hub** do Supabase (PostgreSQL) para MySQL local gerenciado via phpMyAdmin, preparando para futura hospedagem.

---

## 📋 Fase 1: Análise e Preparação

### 1.1 Mapeamento de Dependências
- [ ] Identificar todas as dependências do Supabase no código
- [ ] Listar funcionalidades que dependem do Supabase Auth
- [ ] Documentar uso de Row Level Security (RLS)
- [ ] Identificar uso de Storage do Supabase

### 1.2 Análise do Schema
- [ ] Revisar todas as tabelas e relacionamentos
- [ ] Mapear ENUMs do PostgreSQL para MySQL
- [ ] Identificar funções e triggers que precisam ser adaptadas
- [ ] Documentar políticas RLS para implementação no backend

### 1.3 Backup de Dados
- [ ] Exportar dados existentes do Supabase (se houver)
- [ ] Criar backup do schema atual
- [ ] Documentar dados de teste necessários

---

## 📋 Fase 2: Configuração do Ambiente Local

### 2.1 Instalação e Configuração
- [ ] Verificar se WAMP está instalado e funcionando
- [ ] Criar banco de dados MySQL: `family_finance`
- [ ] Configurar usuário e senha do MySQL
- [ ] Testar conexão via phpMyAdmin

### 2.2 Estrutura de Diretórios
- [ ] Criar pasta `backend/` para API (Node.js/Express ou PHP)
- [ ] Criar pasta `database/` para scripts SQL
- [ ] Criar pasta `database/migrations/` para versionamento

---

## 📋 Fase 3: Migração do Schema

### 3.1 Conversão de Tipos PostgreSQL → MySQL

#### ENUMs
```sql
-- PostgreSQL usa CREATE TYPE, MySQL usa ENUM diretamente na coluna
-- Exemplo:
-- PostgreSQL: CREATE TYPE app_role AS ENUM ('user', 'admin');
-- MySQL: ENUM('user', 'admin')
```

#### UUIDs
- [ ] Decidir: manter UUID ou usar AUTO_INCREMENT
- [ ] Se UUID: instalar extensão ou usar CHAR(36)
- [ ] Se AUTO_INCREMENT: ajustar todas as foreign keys

#### Timestamps
- [ ] Converter TIMESTAMPTZ → DATETIME ou TIMESTAMP
- [ ] Ajustar timezone se necessário

#### DECIMAL
- [ ] Verificar compatibilidade DECIMAL(15,2)

### 3.2 Criação das Tabelas

#### Tabela: `families`
```sql
CREATE TABLE families (
  id CHAR(36) PRIMARY KEY, -- ou INT AUTO_INCREMENT
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabela: `users` (substitui auth.users do Supabase)
```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY, -- ou INT AUTO_INCREMENT
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabela: `profiles`
```sql
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_whatsapp VARCHAR(20),
  avatar_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Tabela: `user_roles`
```sql
CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role)
);
```

#### Tabela: `family_members`
```sql
CREATE TABLE family_members (
  id CHAR(36) PRIMARY KEY,
  family_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_family_user (family_id, user_id)
);
```

#### Tabela: `categories`
```sql
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('income', 'expense', 'investment') NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  family_id CHAR(36),
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

#### Tabela: `credit_cards`
```sql
CREATE TABLE credit_cards (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  holder_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_day TINYINT NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day TINYINT NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (holder_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

#### Tabela: `transactions`
```sql
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY,
  type ENUM('income', 'expense', 'investment') NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  category_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  payment_method ENUM('credit_card', 'debit_card', 'pix', 'cash', 'bank_slip', 'transfer') NOT NULL,
  credit_card_id CHAR(36),
  is_installment BOOLEAN DEFAULT FALSE,
  total_installments INT,
  current_installment INT,
  installment_group_id CHAR(36),
  notes TEXT,
  attachment_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL
);
```

#### Tabela: `budgets`
```sql
CREATE TABLE budgets (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  family_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  month TINYINT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  limit_amount DECIMAL(15,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_budget (category_id, family_id, user_id, month, year)
);
```

#### Tabela: `financial_goals`
```sql
CREATE TABLE financial_goals (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  family_id CHAR(36) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

#### Tabela: `alerts`
```sql
CREATE TABLE alerts (
  id CHAR(36) PRIMARY KEY,
  type ENUM('due_date', 'budget_exceeded', 'goal_progress', 'installment') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  channel ENUM('app', 'whatsapp', 'email') NOT NULL DEFAULT 'app',
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for DATETIME,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3.3 Índices
- [ ] Criar índices para foreign keys
- [ ] Criar índices para campos de busca frequente (email, user_id, family_id)
- [ ] Índices para queries de data (transactions.date)

### 3.4 Triggers MySQL
- [ ] Converter trigger `handle_new_user()` para MySQL
- [ ] Converter trigger `update_updated_at()` para MySQL
- [ ] Testar triggers no MySQL

---

## 📋 Fase 4: Backend API

### 4.1 Escolha da Tecnologia
**Opção A: Node.js + Express**
- [ ] Instalar Express, MySQL2, bcrypt, jsonwebtoken
- [ ] Criar estrutura de rotas
- [ ] Implementar middleware de autenticação

**Opção B: PHP (recomendado para WAMP)**
- [ ] Criar API REST com PHP
- [ ] Usar PDO para MySQL
- [ ] Implementar autenticação JWT ou sessões

### 4.2 Autenticação
- [ ] Implementar registro de usuário (hash de senha com bcrypt)
- [ ] Implementar login (JWT ou sessão)
- [ ] Middleware de verificação de token/sessão
- [ ] Refresh token (opcional)

### 4.3 Endpoints da API

#### Autenticação
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

#### Famílias
- `GET /api/families` - Listar famílias do usuário
- `POST /api/families` - Criar família
- `GET /api/families/:id` - Detalhes da família
- `PUT /api/families/:id` - Atualizar família
- `DELETE /api/families/:id` - Deletar família

#### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Detalhes
- `PUT /api/transactions/:id` - Atualizar
- `DELETE /api/transactions/:id` - Deletar

#### Cartões
- `GET /api/credit-cards` - Listar cartões
- `POST /api/credit-cards` - Criar cartão
- `PUT /api/credit-cards/:id` - Atualizar
- `DELETE /api/credit-cards/:id` - Deletar

#### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria

#### Orçamentos
- `GET /api/budgets` - Listar orçamentos
- `POST /api/budgets` - Criar orçamento

#### Metas
- `GET /api/goals` - Listar metas
- `POST /api/goals` - Criar meta

### 4.4 Autorização
- [ ] Implementar verificação de role (user/admin)
- [ ] Verificar se usuário pertence à família
- [ ] Validar ownership de recursos (usuário só acessa seus próprios dados, exceto admin)

### 4.5 Upload de Arquivos
- [ ] Configurar upload de anexos (multer para Node.js ou move_uploaded_file para PHP)
- [ ] Salvar caminho no banco
- [ ] Servir arquivos estáticos

---

## 📋 Fase 5: Atualização do Frontend

### 5.1 Remover Dependências do Supabase
- [ ] Remover `@supabase/supabase-js` do package.json
- [ ] Remover pasta `src/integrations/supabase/`
- [ ] Remover configurações do Supabase

### 5.2 Criar Cliente HTTP
- [ ] Instalar `axios` ou usar `fetch` nativo
- [ ] Criar `src/lib/api.ts` com cliente HTTP
- [ ] Configurar interceptors para adicionar token JWT
- [ ] Tratamento de erros global

### 5.3 Atualizar Hooks
- [ ] Refatorar `useAuth.tsx` para usar API REST
- [ ] Atualizar `useTransactions.tsx`
- [ ] Atualizar `useCreditCards.tsx`
- [ ] Atualizar `useCategories.tsx`
- [ ] Atualizar `useFamily.tsx`
- [ ] Atualizar `useProfile.tsx`
- [ ] Atualizar todos os outros hooks

### 5.4 Atualizar Componentes
- [ ] Verificar componentes que usam Supabase diretamente
- [ ] Atualizar para usar hooks refatorados
- [ ] Testar fluxo de autenticação

### 5.5 Variáveis de Ambiente
- [ ] Criar `.env` com:
  ```
  VITE_API_URL=http://localhost:3000/api
  ```
- [ ] Atualizar `.env.example`

---

## 📋 Fase 6: Migração de Dados (se aplicável)

### 6.1 Script de Migração
- [ ] Criar script para exportar dados do Supabase
- [ ] Criar script para importar no MySQL
- [ ] Mapear UUIDs (se mudar para AUTO_INCREMENT, criar tabela de mapeamento)
- [ ] Validar integridade dos dados

---

## 📋 Fase 7: Testes

### 7.1 Testes Funcionais
- [ ] Testar registro e login
- [ ] Testar CRUD de transações
- [ ] Testar CRUD de cartões
- [ ] Testar criação de família
- [ ] Testar permissões (user vs admin)
- [ ] Testar upload de anexos

### 7.2 Testes de Performance
- [ ] Verificar queries lentas
- [ ] Otimizar índices se necessário
- [ ] Testar com volume de dados

---

## 📋 Fase 8: Documentação

### 8.1 Documentação Técnica
- [ ] Documentar estrutura da API
- [ ] Documentar schema do banco
- [ ] Documentar variáveis de ambiente
- [ ] Atualizar README.md

### 8.2 Guia de Instalação
- [ ] Passo a passo para setup local
- [ ] Configuração do MySQL
- [ ] Execução de migrações
- [ ] Inicialização do backend

---

## 📋 Fase 9: Preparação para Hospedagem

### 9.1 Configurações de Produção
- [ ] Variáveis de ambiente de produção
- [ ] Configuração de CORS
- [ ] Configuração de HTTPS
- [ ] Backup automático do banco

### 9.2 Deploy
- [ ] Escolher provedor de hospedagem (ex: cPanel, VPS)
- [ ] Configurar domínio
- [ ] Deploy do backend
- [ ] Deploy do frontend (build estático)
- [ ] Configurar banco MySQL na hospedagem

---

## 🔧 Ferramentas e Bibliotecas Necessárias

### Backend (Node.js)
- `express` - Framework web
- `mysql2` - Cliente MySQL
- `bcrypt` - Hash de senhas
- `jsonwebtoken` - JWT tokens
- `cors` - CORS middleware
- `dotenv` - Variáveis de ambiente
- `multer` - Upload de arquivos (se Node.js)

### Backend (PHP)
- PDO MySQL
- `password_hash()` / `password_verify()` - Hash de senhas
- JWT library (ex: `firebase/php-jwt`)
- Upload de arquivos nativo

### Frontend
- `axios` - Cliente HTTP (opcional, pode usar fetch)
- Manter TanStack Query para cache

---

## ⚠️ Pontos de Atenção

1. **UUID vs AUTO_INCREMENT**: Decidir estratégia antes de começar
2. **Autenticação**: Supabase Auth é robusto, precisa replicar segurança
3. **RLS**: Implementar autorização no backend (não confiar apenas no frontend)
4. **Storage**: Configurar servidor de arquivos para anexos
5. **Timezones**: Ajustar timestamps conforme necessário
6. **Validação**: Implementar validação no backend (não confiar apenas no frontend)
7. **Rate Limiting**: Considerar para produção
8. **Backup**: Configurar backup automático do MySQL

---

## 📅 Estimativa de Tempo

- **Fase 1-2**: 2-4 horas (análise e setup)
- **Fase 3**: 4-6 horas (migração do schema)
- **Fase 4**: 8-12 horas (desenvolvimento da API)
- **Fase 5**: 6-8 horas (atualização do frontend)
- **Fase 6**: 2-4 horas (migração de dados, se necessário)
- **Fase 7**: 4-6 horas (testes)
- **Fase 8-9**: 2-4 horas (documentação e preparação)

**Total estimado**: 28-44 horas

---

## 🎯 Próximos Passos Imediatos

1. ✅ Criar este plano de migração
2. ⬜ Decidir: Node.js ou PHP para backend
3. ⬜ Decidir: UUID ou AUTO_INCREMENT
4. ⬜ Criar banco MySQL no phpMyAdmin
5. ⬜ Começar pela Fase 3 (migração do schema)

