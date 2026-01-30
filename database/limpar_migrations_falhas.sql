-- ============================================
-- Limpar registros de migrations que falharam
-- Execute este SQL no phpMyAdmin
-- ============================================

USE family_finance;

-- Remover registros de migrations onde as tabelas não foram criadas
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

-- Verificar resultado
SELECT COUNT(*) as total_migrations FROM migrations;
SELECT migration_name FROM migrations ORDER BY executed_at;
