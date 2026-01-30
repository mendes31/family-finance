# Resumo das Correções nas Tabelas

## ✅ Verificações Realizadas

### 1. Estrutura das Tabelas

#### ✅ Tabela `users`
- **Status**: ✅ Correta
- **Campos**: `id`, `email`, `password_hash`, `email_verified`, `created_at`, `updated_at`
- **Observação**: `full_name` está na tabela `profiles`, não em `users`

#### ✅ Tabela `families`
- **Status**: ✅ Correta
- **Campos**: `id`, `name`, `created_at`, `updated_at`

#### ✅ Tabela `family_members`
- **Status**: ✅ Correta
- **Campos**: `id`, `family_id`, `user_id`, `joined_at`
- **Foreign Keys**: ✅ Configuradas corretamente

#### ✅ Tabela `user_roles`
- **Status**: ⚠️ Precisa ajuste
- **Problema**: A constraint `unique_user_role (user_id, role)` permite múltiplas roles por usuário
- **Solução**: Migration 024 criada para corrigir

#### ✅ Tabela `profiles`
- **Status**: ✅ Correta
- **Campos**: `id`, `full_name`, `email`, `phone_whatsapp`, `avatar_url`, `created_at`, `updated_at`

### 2. Código de Criação de Família

#### ✅ `api/family.php` - `handleCreateFamily()`
- **Status**: ✅ Corrigido
- **Garantias**:
  1. ✅ Adiciona o criador à tabela `family_members`
  2. ✅ Promove o criador a admin na tabela `user_roles`
  3. ✅ Remove role 'user' se existir antes de criar 'admin'
  4. ✅ Usa transação para garantir atomicidade

### 3. Correções Aplicadas

#### ✅ Correção em `api/email_settings.php`
- **Problema**: Tentava buscar `full_name` da tabela `users` (não existe)
- **Solução**: Removido `full_name` da query

## 📋 Migrations Criadas

### Migration 023: Fix Family Creation - Ensure Admin
**Arquivo**: `database/migrations/023_fix_family_creation_ensure_admin.sql`

**Objetivo**: Corrigir casos onde criadores de família não têm role de admin

**Ações**:
1. Identifica criadores de família sem role de admin
2. Atualiza roles existentes para 'admin'
3. Insere role 'admin' para usuários sem role
4. Verifica resultado

**Como executar**:
```sql
-- No phpMyAdmin ou MySQL
SOURCE database/migrations/023_fix_family_creation_ensure_admin.sql;
```

### Migration 024: Fix User Roles Unique Constraint
**Arquivo**: `database/migrations/024_fix_user_roles_unique_constraint.sql`

**Objetivo**: Garantir que cada usuário tenha apenas UMA role

**Ações**:
1. Identifica usuários com múltiplas roles
2. Remove role 'user' se o usuário também tem 'admin'
3. Remove constraint antiga `unique_user_role (user_id, role)`
4. Cria nova constraint `unique_user_id` (apenas UMA role por usuário)

**Como executar**:
```sql
-- No phpMyAdmin ou MySQL
SOURCE database/migrations/024_fix_user_roles_unique_constraint.sql;
```

## 🚀 Como Aplicar as Correções

### Opção 1: Executar Migrations Individualmente

1. Acesse `http://localhost/phpmyadmin`
2. Selecione o banco `family_finance`
3. Clique na aba **SQL**
4. Execute cada migration na ordem:
   - `023_fix_family_creation_ensure_admin.sql`
   - `024_fix_user_roles_unique_constraint.sql`

### Opção 2: Executar via Terminal

```bash
# No PowerShell
Get-Content database\migrations\023_fix_family_creation_ensure_admin.sql | mysql -u root -p family_finance
Get-Content database\migrations\024_fix_user_roles_unique_constraint.sql | mysql -u root -p family_finance
```

## ✅ Garantias Implementadas

### Ao Criar uma Família

1. ✅ Família é criada na tabela `families`
2. ✅ Criador é adicionado à tabela `family_members`
3. ✅ Criador recebe role 'admin' na tabela `user_roles`
4. ✅ Se o criador já tiver role 'user', ela é removida antes de criar 'admin'
5. ✅ Tudo acontece em uma transação (atomicidade)

### Estrutura de Dados

- ✅ Todas as foreign keys estão configuradas
- ✅ Constraints estão corretas
- ✅ Índices estão otimizados
- ✅ Campos obrigatórios estão definidos

## 🔍 Verificações Pós-Correção

Execute estas queries para verificar se tudo está correto:

```sql
-- 1. Verificar se todos os criadores de família são admin
SELECT 
    f.name as family_name,
    u.email,
    ur.role,
    CASE 
        WHEN ur.role = 'admin' THEN '✅'
        ELSE '❌'
    END as status
FROM families f
INNER JOIN family_members fm ON fm.family_id = f.id
INNER JOIN users u ON u.id = fm.user_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE fm.joined_at = (
    SELECT MIN(fm2.joined_at) 
    FROM family_members fm2 
    WHERE fm2.family_id = f.id
)
ORDER BY f.created_at;

-- 2. Verificar se há usuários com múltiplas roles (não deve haver)
SELECT 
    user_id,
    COUNT(*) as total_roles,
    GROUP_CONCAT(role SEPARATOR ', ') as roles
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

## 📝 Notas Importantes

1. **`full_name` não está em `users`**: Está na tabela `profiles`
2. **Um usuário = Uma role**: Após a migration 024, cada usuário terá apenas uma role
3. **Criador sempre admin**: O código garante que quem cria a família seja admin
4. **Transações**: Todas as operações críticas usam transações para garantir consistência


