# 📊 Análise Completa do Projeto - Family Finance Hub

## 🎯 Resumo Executivo

O **Family Finance Hub** é uma aplicação web moderna para gerenciamento financeiro familiar colaborativo. O projeto está atualmente configurado para usar **Supabase** (PostgreSQL) como backend, mas está sendo preparado para migração para **MySQL local** via phpMyAdmin, visando futura hospedagem.

### Estado Atual
- ✅ Frontend completo em React + TypeScript
- ✅ Interface moderna com shadcn/ui e Tailwind CSS
- ✅ Sistema de autenticação funcional (Supabase Auth)
- ✅ CRUD completo de transações, cartões, categorias
- ✅ Dashboard com gráficos e estatísticas
- ✅ Sistema de roles (user/admin) e controle de famílias
- ⚠️ Dependência do Supabase para backend
- ⚠️ Necessita migração para MySQL local

---

## 🏗️ Arquitetura Atual

### Stack Tecnológica

#### Frontend
- **React 18.3.1** - Biblioteca JavaScript
- **TypeScript 5.8.3** - Tipagem estática
- **Vite 5.4.19** - Build tool
- **React Router DOM 6.30.1** - Roteamento
- **TanStack Query 5.83.0** - Gerenciamento de estado assíncrono
- **React Hook Form 7.61.1** - Formulários
- **Zod 3.25.76** - Validação de schemas

#### UI/UX
- **shadcn/ui** - Componentes baseados em Radix UI
- **Tailwind CSS 3.4.17** - Framework CSS
- **Lucide React** - Ícones
- **Recharts 2.15.4** - Gráficos
- **Sonner** - Notificações toast

#### Backend (Atual - Supabase)
- **Supabase** - BaaS completo
  - PostgreSQL como banco de dados
  - Autenticação integrada
  - Row Level Security (RLS)
  - Storage para anexos

---

## 📁 Estrutura de Diretórios

```
family_finance/
├── src/
│   ├── components/
│   │   ├── auth/              # ProtectedRoute
│   │   ├── dashboard/         # Widgets do dashboard
│   │   │   ├── CreditCardWidget.tsx
│   │   │   ├── ExpenseChart.tsx
│   │   │   ├── MonthlyChart.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── layout/            # Layout principal
│   │   │   ├── MainLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── modals/            # Modais de adição
│   │   │   ├── AddCreditCardModal.tsx
│   │   │   └── AddTransactionModal.tsx
│   │   ├── onboarding/        # Onboarding de família
│   │   │   └── FamilyOnboarding.tsx
│   │   └── ui/                # Componentes shadcn/ui (40+ componentes)
│   ├── hooks/                 # Custom hooks React
│   │   ├── useAuth.tsx        # Autenticação
│   │   ├── useTransactions.tsx
│   │   ├── useCreditCards.tsx
│   │   ├── useCategories.tsx
│   │   ├── useFamily.tsx
│   │   ├── useProfile.tsx
│   │   ├── useUserRole.tsx
│   │   ├── useMonthlyTrends.tsx
│   │   └── useExpensesByCategory.tsx
│   ├── integrations/
│   │   └── supabase/          # Cliente Supabase
│   │       ├── client.ts
│   │       └── types.ts
│   ├── pages/                 # Páginas principais
│   │   ├── Index.tsx          # Página inicial
│   │   ├── Auth.tsx           # Login/Registro
│   │   ├── Dashboard.tsx      # Dashboard principal
│   │   ├── Transactions.tsx   # Lista de transações
│   │   ├── Cards.tsx          # Gerenciamento de cartões
│   │   └── NotFound.tsx
│   ├── types/
│   │   └── finance.ts         # Tipos TypeScript
│   └── lib/
│       └── utils.ts           # Utilitários
├── supabase/
│   ├── migrations/            # Migrações SQL (4 arquivos)
│   └── config.toml
├── public/                    # Arquivos estáticos
└── [config files]             # package.json, vite.config.ts, etc.
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais (10 tabelas)

1. **families** - Famílias cadastradas
   - `id` (UUID)
   - `name` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **profiles** - Perfis de usuários
   - `id` (UUID) - Referência a auth.users
   - `full_name`, `email`, `phone_whatsapp`, `avatar_url`
   - `created_at`, `updated_at`

3. **user_roles** - Roles dos usuários
   - `id` (UUID)
   - `user_id` (UUID)
   - `role` (ENUM: 'user' | 'admin')
   - `created_at`

4. **family_members** - Relação usuários-famílias
   - `id` (UUID)
   - `family_id`, `user_id` (UUID)
   - `joined_at` (TIMESTAMPTZ)

5. **categories** - Categorias de transações
   - `id` (UUID)
   - `name`, `type` (ENUM), `icon`, `color`
   - `family_id` (UUID, nullable)
   - `is_default` (BOOLEAN)

6. **credit_cards** - Cartões de crédito
   - `id` (UUID)
   - `name`, `brand`
   - `holder_id`, `family_id` (UUID)
   - `credit_limit` (DECIMAL)
   - `closing_day`, `due_day` (INTEGER)
   - `is_active` (BOOLEAN)

7. **transactions** - Transações financeiras
   - `id` (UUID)
   - `type` (ENUM: 'income' | 'expense' | 'investment')
   - `description`, `amount` (DECIMAL)
   - `date` (DATE)
   - `category_id`, `user_id`, `family_id` (UUID)
   - `payment_method` (ENUM)
   - `credit_card_id` (UUID, nullable)
   - Suporte a parcelas: `is_installment`, `total_installments`, `current_installment`, `installment_group_id`
   - `notes`, `attachment_url`
   - `created_at`, `updated_at`

8. **budgets** - Orçamentos mensais
   - `id` (UUID)
   - `category_id`, `family_id`, `user_id` (UUID)
   - `month` (INTEGER 1-12), `year` (INTEGER)
   - `limit_amount` (DECIMAL)

9. **financial_goals** - Metas financeiras
   - `id` (UUID)
   - `name`, `target_amount`, `current_amount` (DECIMAL)
   - `deadline` (DATE)
   - `family_id` (UUID)
   - `is_completed` (BOOLEAN)

10. **alerts** - Alertas e notificações
    - `id` (UUID)
    - `type` (ENUM), `title`, `message`
    - `reference_id`, `user_id` (UUID)
    - `channel` (ENUM: 'app' | 'whatsapp' | 'email')
    - `is_read` (BOOLEAN)
    - `scheduled_for`, `sent_at` (TIMESTAMPTZ)

### Enums (Tipos)
- `app_role`: 'user' | 'admin'
- `transaction_type`: 'income' | 'expense' | 'investment'
- `payment_method`: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'bank_slip' | 'transfer'
- `alert_channel`: 'app' | 'whatsapp' | 'email'
- `alert_type`: 'due_date' | 'budget_exceeded' | 'goal_progress' | 'installment'

### Segurança (RLS - Row Level Security)
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas baseadas em roles e família
- ✅ Funções de segurança: `has_role()`, `user_in_family()`
- ✅ Trigger automático para criar perfil ao registrar usuário

---

## 🔐 Sistema de Autenticação Atual

### Fluxo de Autenticação (Supabase)
1. Usuário faz login/registro via `useAuth` hook
2. Supabase Auth gerencia sessão e tokens
3. Sessão persistida no `localStorage`
4. Auto-refresh de tokens
5. `ProtectedRoute` protege rotas autenticadas
6. Context API (`AuthProvider`) gerencia estado global

### Funcionalidades
- ✅ Registro com email/senha
- ✅ Login com email/senha
- ✅ Logout
- ✅ Verificação de sessão persistida
- ✅ Onboarding de família (criação automática)

---

## 📊 Funcionalidades Implementadas

### 1. Dashboard
- ✅ Estatísticas financeiras (receitas, despesas, investimentos, saldo)
- ✅ Gráficos de tendências mensais (Recharts)
- ✅ Lista de transações recentes
- ✅ Widgets de cartões de crédito
- ✅ Ações rápidas

### 2. Transações
- ✅ Cadastro de receitas, despesas e investimentos
- ✅ Suporte a parcelas (criação automática de múltiplas transações)
- ✅ Categorização
- ✅ Múltiplos métodos de pagamento
- ✅ Vinculação a cartões de crédito
- ✅ Anexos de comprovantes (via Supabase Storage)
- ✅ Filtros por tipo, data, categoria

### 3. Cartões de Crédito
- ✅ Cadastro de cartões
- ✅ Controle de limite, dia de fechamento e vencimento
- ✅ Vinculação a transações
- ✅ Status ativo/inativo

### 4. Categorias
- ✅ Categorias padrão do sistema
- ✅ Categorias personalizadas por família
- ✅ Ícones e cores
- ✅ Tipos: income, expense, investment

### 5. Famílias
- ✅ Criação de família no onboarding
- ✅ Múltiplos membros por família
- ✅ Sistema de roles (admin pode gerenciar membros)

### 6. Perfil
- ✅ Visualização e edição de perfil
- ✅ Avatar, nome, email, telefone WhatsApp

---

## 🔄 Fluxo de Dados Atual

```
Frontend (React)
    ↓
Hooks (useAuth, useTransactions, etc.)
    ↓
Supabase Client (@supabase/supabase-js)
    ↓
Supabase Backend
    ├── Auth (autenticação)
    ├── PostgreSQL (banco de dados)
    ├── RLS (Row Level Security)
    └── Storage (anexos)
```

### TanStack Query
- Cache automático de queries
- Invalidação automática após mutations
- Sincronização de estado
- Loading e error states

---

## ⚠️ Dependências do Supabase

### O que precisa ser migrado:
1. **Autenticação** - Atualmente usa Supabase Auth
2. **Banco de Dados** - PostgreSQL → MySQL
3. **RLS (Row Level Security)** - Precisa ser implementado no backend
4. **Storage** - Upload de anexos precisa de servidor de arquivos
5. **Triggers** - Funções PostgreSQL precisam ser convertidas para MySQL

---

## 📦 Dependências Principais

### Produção
- `@supabase/supabase-js` - Cliente Supabase (será removido)
- `@tanstack/react-query` - Gerenciamento de estado
- `react-router-dom` - Roteamento
- `recharts` - Gráficos
- `date-fns` - Manipulação de datas
- `react-hook-form` + `zod` - Formulários e validação

### Desenvolvimento
- `vite` - Build tool
- `typescript` - Tipagem
- `tailwindcss` - CSS framework
- `eslint` - Linter

---

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento (porta 8080)
npm run build        # Build para produção
npm run build:dev    # Build em modo desenvolvimento
npm run lint         # Executa linter
npm run preview      # Preview do build
```

---

## 📝 Observações Importantes

1. **UUID vs AUTO_INCREMENT**: Projeto usa UUIDs (PostgreSQL). Na migração para MySQL, pode manter UUIDs (CHAR(36)) ou migrar para AUTO_INCREMENT.

2. **Autenticação**: Supabase Auth é robusto. Na migração, precisa implementar:
   - Hash de senhas (bcrypt)
   - JWT tokens ou sessões
   - Refresh tokens

3. **RLS**: Row Level Security do Supabase filtra dados automaticamente. No backend customizado, precisa implementar autorização manualmente.

4. **Storage**: Anexos estão no Supabase Storage. Na migração, precisa configurar servidor de arquivos (ex: pasta `uploads/`).

5. **Timezones**: PostgreSQL usa TIMESTAMPTZ. MySQL usa DATETIME ou TIMESTAMP. Ajustar conforme necessário.

---

## 🎯 Próximos Passos Recomendados

1. ✅ **Análise completa** (este documento)
2. ⬜ **Criar banco MySQL no phpMyAdmin**
3. ⬜ **Migrar schema PostgreSQL → MySQL**
4. ⬜ **Desenvolver backend API (Node.js/Express ou PHP)**
5. ⬜ **Refatorar frontend para usar API REST**
6. ⬜ **Testes e validação**
7. ⬜ **Preparação para hospedagem**

---

## 📊 Métricas do Projeto

- **Componentes React**: ~50+ componentes
- **Hooks customizados**: 10 hooks
- **Páginas**: 6 páginas principais
- **Tabelas do banco**: 10 tabelas
- **Linhas de código**: ~5000+ linhas (estimativa)
- **Dependências**: 40+ pacotes npm

---

## 🔗 Arquivos de Referência

- `RESUMO_PROJETO.md` - Resumo técnico detalhado
- `PLANO_MIGRACAO_MYSQL.md` - Plano completo de migração
- `supabase/migrations/` - Schema SQL original
- `src/integrations/supabase/` - Cliente Supabase atual

---

**Última atualização**: 30 de dezembro de 2024

