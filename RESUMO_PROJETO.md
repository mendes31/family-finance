# Resumo do Projeto - Family Finance Hub

## 📋 Visão Geral

O **Family Finance Hub** é uma aplicação web moderna para gerenciamento financeiro familiar, desenvolvida com React, TypeScript e Supabase. O sistema permite que famílias gerenciem suas finanças de forma colaborativa, incluindo controle de transações, cartões de crédito, orçamentos, metas financeiras e alertas.

## 🛠️ Stack Tecnológica

### Frontend
- **React 18.3.1** - Biblioteca JavaScript para interfaces
- **TypeScript 5.8.3** - Tipagem estática
- **Vite 5.4.19** - Build tool e dev server
- **React Router DOM 6.30.1** - Roteamento
- **TanStack Query 5.83.0** - Gerenciamento de estado do servidor
- **React Hook Form 7.61.1** - Formulários
- **Zod 3.25.76** - Validação de schemas

### UI/UX
- **shadcn/ui** - Componentes UI baseados em Radix UI
- **Tailwind CSS 3.4.17** - Framework CSS utility-first
- **Lucide React** - Ícones
- **Recharts 2.15.4** - Gráficos e visualizações
- **Sonner** - Sistema de notificações toast

### Backend/Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL como banco de dados
  - Autenticação integrada
  - Row Level Security (RLS)
  - Storage para anexos

## 📁 Estrutura do Projeto

```
family-finance-hub/
├── src/
│   ├── components/          # Componentes React
│   │   ├── auth/           # Autenticação (ProtectedRoute)
│   │   ├── dashboard/      # Widgets do dashboard
│   │   ├── layout/         # Layout principal e sidebar
│   │   ├── modals/         # Modais de adição
│   │   ├── onboarding/     # Onboarding de família
│   │   └── ui/             # Componentes shadcn/ui
│   ├── hooks/              # Custom hooks React
│   │   ├── useAuth.tsx     # Autenticação
│   │   ├── useTransactions.tsx
│   │   ├── useCreditCards.tsx
│   │   ├── useCategories.tsx
│   │   ├── useFamily.tsx
│   │   ├── useProfile.tsx
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/       # Cliente e tipos Supabase
│   ├── pages/              # Páginas principais
│   │   ├── Index.tsx       # Página inicial
│   │   ├── Auth.tsx        # Login/Registro
│   │   ├── Dashboard.tsx   # Dashboard principal
│   │   ├── Transactions.tsx
│   │   └── Cards.tsx
│   ├── types/              # Definições TypeScript
│   └── lib/                # Utilitários
├── supabase/
│   ├── migrations/         # Migrações SQL
│   └── config.toml         # Configuração Supabase
└── public/                 # Arquivos estáticos
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

1. **families** - Famílias cadastradas
2. **profiles** - Perfis de usuários (vinculado a auth.users)
3. **user_roles** - Roles dos usuários (user/admin)
4. **family_members** - Relação usuários-famílias
5. **categories** - Categorias de transações
6. **credit_cards** - Cartões de crédito
7. **transactions** - Transações financeiras
8. **budgets** - Orçamentos mensais por categoria
9. **financial_goals** - Metas financeiras
10. **alerts** - Alertas e notificações

### Enums (Tipos)
- `app_role`: 'user' | 'admin'
- `transaction_type`: 'income' | 'expense' | 'investment'
- `payment_method`: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'bank_slip' | 'transfer'
- `alert_channel`: 'app' | 'whatsapp' | 'email'
- `alert_type`: 'due_date' | 'budget_exceeded' | 'goal_progress' | 'installment'

### Funcionalidades de Segurança
- **Row Level Security (RLS)** habilitado em todas as tabelas
- Políticas de acesso baseadas em roles e família
- Funções de segurança: `has_role()`, `user_in_family()`
- Trigger automático para criar perfil ao registrar usuário

## 🔐 Sistema de Autenticação

- Autenticação via Supabase Auth
- Sessões persistidas no localStorage
- Auto-refresh de tokens
- Proteção de rotas com `ProtectedRoute`
- Context API para gerenciamento de estado de autenticação

## 📊 Funcionalidades Principais

### 1. Dashboard
- Estatísticas financeiras (receitas, despesas, investimentos)
- Gráficos de tendências mensais
- Lista de transações recentes
- Widgets de cartões de crédito
- Ações rápidas

### 2. Transações
- Cadastro de receitas, despesas e investimentos
- Suporte a parcelas
- Categorização
- Múltiplos métodos de pagamento
- Anexos de comprovantes

### 3. Cartões de Crédito
- Cadastro de cartões
- Controle de limite, dia de fechamento e vencimento
- Vinculação a transações

### 4. Orçamentos
- Orçamentos mensais por categoria
- Controle de gastos vs. limite

### 5. Metas Financeiras
- Definição de metas
- Acompanhamento de progresso

### 6. Alertas
- Notificações de vencimentos
- Alertas de orçamento excedido
- Progresso de metas

## 🔄 Fluxo de Dados

1. **Autenticação**: Usuário faz login → Supabase Auth → Cria sessão
2. **Onboarding**: Novo usuário cria família → Função `create_family_with_admin()`
3. **Transações**: CRUD via hooks → Supabase Client → PostgreSQL
4. **Queries**: TanStack Query para cache e sincronização
5. **RLS**: Políticas do Supabase filtram dados por família/usuário

## 📦 Dependências Principais

- `@supabase/supabase-js` - Cliente Supabase
- `@tanstack/react-query` - Gerenciamento de estado assíncrono
- `react-router-dom` - Roteamento
- `recharts` - Gráficos
- `date-fns` - Manipulação de datas
- Componentes Radix UI (via shadcn/ui)

## 🌐 Configuração Atual

- **URL do Supabase**: Configurada via variável de ambiente `VITE_SUPABASE_URL`
- **Chave Pública**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Porta de Desenvolvimento**: 8080
- **Build Tool**: Vite

## 📝 Observações Importantes

1. O projeto usa **Supabase** como backend completo (banco + auth + storage)
2. Todas as queries passam por **Row Level Security**
3. Sistema de **roles** (user/admin) para controle de acesso
4. Suporte a **múltiplas famílias** por usuário (via family_members)
5. **Triggers** automáticos para criação de perfis e atualização de timestamps
6. **Storage** configurado para anexos de transações

## 🚀 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run build:dev` - Build em modo desenvolvimento
- `npm run lint` - Executa linter
- `npm run preview` - Preview do build

