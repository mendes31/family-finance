# 🔧 Solução para Migrations que Falharam

## ❌ Problema Identificado

As migrations 003-011 foram registradas como executadas, mas as tabelas não foram criadas. Isso aconteceu porque o script estava ignorando alguns erros silenciosamente.

## ✅ Solução Passo a Passo

### Opção 1: Via phpMyAdmin (Recomendado)

1. Abra o phpMyAdmin
2. Selecione o banco `family_finance`
3. Vá na aba **SQL**
4. Cole e execute este código:

```sql
-- Limpar registros de migrations que falharam
DELETE FROM migrations 
WHERE migration_name IN (
    '003_create_profiles_table.sql',
    '004_create_user_roles_table.sql',
    '005_create_family_members_table.sql',
    '006_create_categories_table.sql',
    '007_create_credit_cards_table.sql',
    '008_create_transactions_table.sql',
    '009_create_budgets_table.sql',
    '010_create_financial_goals_table.sql',
    '011_create_alerts_table.sql'
);
```

5. Depois execute novamente: `php database/run_migrations.php`

### Opção 2: Via Linha de Comando MySQL

```bash
mysql -u root -p family_finance < database/limpar_migrations_falhas.sql
```

### Opção 3: Executar SQL Direto

Execute este comando no PowerShell (ajuste usuário/senha se necessário):

```powershell
mysql -u root family_finance -e "DELETE FROM migrations WHERE migration_name IN ('003_create_profiles_table.sql','004_create_user_roles_table.sql','005_create_family_members_table.sql','006_create_categories_table.sql','007_create_credit_cards_table.sql','008_create_transactions_table.sql','009_create_budgets_table.sql','010_create_financial_goals_table.sql','011_create_alerts_table.sql');"
```

## 🔍 Verificar Depois

Execute para verificar se as tabelas foram criadas:

```powershell
php database/verificar_tabelas.php
```

## 📋 Ordem Correta das Dependências

As migrations devem ser executadas nesta ordem:

1. ✅ `001_create_users_table.sql` - Base (sem dependências)
2. ✅ `002_create_families_table.sql` - Base (sem dependências)
3. ⚠️ `003_create_profiles_table.sql` - Depende de: `users`
4. ⚠️ `004_create_user_roles_table.sql` - Depende de: `users`
5. ⚠️ `005_create_family_members_table.sql` - Depende de: `families`, `users`
6. ⚠️ `006_create_categories_table.sql` - Depende de: `families`
7. ⚠️ `007_create_credit_cards_table.sql` - Depende de: `users`, `families`
8. ⚠️ `008_create_transactions_table.sql` - Depende de: `categories`, `users`, `families`, `credit_cards`
9. ⚠️ `009_create_budgets_table.sql` - Depende de: `categories`, `families`, `users`
10. ⚠️ `010_create_financial_goals_table.sql` - Depende de: `families`
11. ⚠️ `011_create_alerts_table.sql` - Depende de: `users`

---

**Última atualização**: 2026-01-05

