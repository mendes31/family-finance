# Como Executar as Migrations 023 e 024

## ✅ Correções Aplicadas

### 1. Migration 023: Fix Family Creation - Ensure Admin
- **Simplificada**: Removidas queries SELECT de verificação
- **Ações**: Apenas UPDATE e INSERT para corrigir dados

### 2. Migration 024: Fix User Roles Unique Constraint  
- **Simplificada**: Removido uso de `information_schema` e `PREPARE/EXECUTE`
- **Ações**: DELETE de roles duplicadas e criação de constraint única

### 3. Script de Migrations
- **Corrigido**: Adicionado `PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true` para resolver erro de unbuffered queries

## 🚀 Como Executar

### Opção 1: Via Script PHP (Recomendado)

```powershell
php database/run_migrations.php
```

O script agora está corrigido e deve executar sem erros.

### Opção 2: Via phpMyAdmin (Manual)

1. Acesse `http://localhost/phpmyadmin`
2. Selecione o banco `family_finance`
3. Clique na aba **SQL**

#### Execute a Migration 023:

```sql
USE family_finance;

-- Atualizar roles existentes para 'admin' se o usuário é o primeiro membro
UPDATE user_roles ur
INNER JOIN (
    SELECT fm.user_id, fm.family_id
    FROM family_members fm
    WHERE fm.joined_at = (
        SELECT MIN(fm2.joined_at) 
        FROM family_members fm2 
        WHERE fm2.family_id = fm.family_id
    )
) as first_members ON first_members.user_id = ur.user_id
SET ur.role = 'admin'
WHERE ur.role != 'admin';

-- Inserir role de admin para usuários que são primeiros membros mas não têm role
INSERT INTO user_roles (id, user_id, role, created_at)
SELECT 
    UUID() as id,
    first_members.user_id,
    'admin' as role,
    NOW() as created_at
FROM (
    SELECT DISTINCT fm.user_id
    FROM family_members fm
    WHERE fm.joined_at = (
        SELECT MIN(fm2.joined_at) 
        FROM family_members fm2 
        WHERE fm2.family_id = fm.family_id
    )
) as first_members
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = first_members.user_id
);
```

#### Execute a Migration 024:

```sql
USE family_finance;

-- Remover roles 'user' duplicadas (manter apenas 'admin' se existir)
DELETE ur1 FROM user_roles ur1
INNER JOIN user_roles ur2 ON ur1.user_id = ur2.user_id
WHERE ur1.role = 'user' 
AND ur2.role = 'admin'
AND ur1.id != ur2.id;

-- Criar constraint única: apenas UMA role por usuário
-- (Se der erro "Duplicate key name", significa que já existe - pode ignorar)
ALTER TABLE user_roles 
ADD UNIQUE KEY unique_user_id (user_id);
```

## ✅ Verificação

Após executar as migrations, verifique se está tudo correto:

```sql
-- Verificar se todos os criadores de família são admin
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

-- Verificar se há usuários com múltiplas roles (não deve haver)
SELECT 
    user_id,
    COUNT(*) as total_roles,
    GROUP_CONCAT(role SEPARATOR ', ') as roles
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

## 🔧 Problemas Resolvidos

1. ✅ **Erro "Cannot execute queries while other unbuffered queries are active"**
   - **Solução**: Adicionado `PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true` no script

2. ✅ **Erro "Acesso negado para information_schema"**
   - **Solução**: Removido uso de `information_schema` e `PREPARE/EXECUTE`

3. ✅ **Múltiplas queries SELECT causando problemas**
   - **Solução**: Removidas queries SELECT de verificação (não são necessárias)

## 📝 Notas

- As migrations agora são mais simples e diretas
- Erros de índice duplicado são ignorados automaticamente pelo script
- As migrations podem ser executadas múltiplas vezes sem problemas


