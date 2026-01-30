# ✅ Recorrência de Transações - Implementada

## 🎯 Funcionalidades Implementadas

### ✅ Backend (PHP)
- **Migration 015**: Adicionados campos de recorrência na tabela `transactions`
  - `is_recurring` - BOOLEAN
  - `recurrence_period` - ENUM('daily', 'weekly', 'monthly', 'yearly')
  - `recurrence_end_date` - DATE (opcional)
  - `recurrence_group_id` - CHAR(36) (para agrupar transações geradas)
  - `parent_recurrence_id` - CHAR(36) (referência à transação pai)

- **API atualizada**: `api/transactions.php`
  - ✅ Suporte para criar transações recorrentes
  - ✅ Suporte para editar recorrência (apenas na transação pai)
  - ✅ Transações geradas automaticamente não podem editar recorrência

### ✅ Frontend
- **Modal de Criação**: `src/components/modals/AddTransactionModal.tsx`
  - ✅ Switch para ativar recorrência
  - ✅ Select de período (Diário, Semanal, Mensal, Anual)
  - ✅ Campo de data final (opcional)

- **Modal de Edição**: `src/components/modals/EditTransactionModal.tsx`
  - ✅ Edição completa de transações
  - ✅ Edição de recorrência (apenas na transação original)
  - ✅ Aviso quando transação foi gerada automaticamente

- **Página de Transações**: `src/pages/Transactions.tsx`
  - ✅ Lista todas as transações
  - ✅ Botões de editar e deletar
  - ✅ Filtros por tipo
  - ✅ Busca por descrição

- **Lista de Transações**: `src/components/dashboard/TransactionList.tsx`
  - ✅ Exibe ícone de recorrência
  - ✅ Mostra período da recorrência
  - ✅ Menu de ações (editar/deletar)

### 📊 Campos de Recorrência

1. **is_recurring**: Indica se a transação é recorrente
2. **recurrence_period**: Período de repetição
   - `daily` - Diário
   - `weekly` - Semanal
   - `monthly` - Mensal
   - `yearly` - Anual
3. **recurrence_end_date**: Data final (opcional, NULL = indefinido)
4. **recurrence_group_id**: ID do grupo (todas as transações do mesmo grupo)
5. **parent_recurrence_id**: ID da transação pai (NULL = transação original)

---

## 🔒 Regras de Negócio

1. **Criação**: Qualquer transação pode ser marcada como recorrente
2. **Edição de Recorrência**: 
   - ✅ Apenas transações **originais** (sem `parent_recurrence_id`) podem editar recorrência
   - ❌ Transações geradas automaticamente não podem editar recorrência
3. **Edição de Dados**: Todas as transações podem ter seus dados editados (valor, data, descrição, etc.)

---

## 📝 Como Usar

### Criar Transação Recorrente
1. Acesse: `http://localhost/family_finance/transactions`
2. Clique em **"Nova Despesa"** ou **"Nova Receita"**
3. Preencha os dados da transação
4. Ative o switch **"Transação Recorrente"**
5. Selecione o **período** (Diário, Semanal, Mensal, Anual)
6. (Opcional) Defina uma **data final**
7. Clique em **"Salvar"**

### Editar Transação Recorrente
1. Na lista de transações, clique no menu (3 pontos)
2. Selecione **"Editar"**
3. Ajuste os dados necessários
4. Se for a transação original, pode editar a recorrência
5. Se for uma transação gerada, verá um aviso informativo
6. Clique em **"Salvar Alterações"**

---

## ⚠️ Próximos Passos (Opcional)

Para gerar automaticamente as transações recorrentes, você pode:

1. **Cron Job**: Criar um script PHP que roda diariamente e gera as transações
2. **Trigger MySQL**: Criar um trigger que gera transações quando necessário
3. **API Endpoint**: Criar endpoint `/api/recurrence/generate` para gerar manualmente

**Nota**: A estrutura está pronta, falta apenas a lógica de geração automática.

---

**Última atualização**: 2026-01-05

