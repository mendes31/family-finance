-- ============================================
-- Seed 001: Default Categories
-- Descrição: Insere categorias padrão do sistema
-- Data: 2026-01-05
-- ============================================

USE family_finance;

-- Categorias de Receita (Income)
INSERT IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES
(generate_uuid(), 'Salário', 'income', 'Briefcase', '#22c55e', TRUE),
(generate_uuid(), 'Freelance', 'income', 'Laptop', '#10b981', TRUE),
(generate_uuid(), 'Investimentos', 'income', 'TrendingUp', '#14b8a6', TRUE),
(generate_uuid(), 'Outros', 'income', 'Plus', '#06b6d4', TRUE);

-- Categorias de Despesa (Expense)
INSERT IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES
(generate_uuid(), 'Alimentação', 'expense', 'UtensilsCrossed', '#ef4444', TRUE),
(generate_uuid(), 'Transporte', 'expense', 'Car', '#f97316', TRUE),
(generate_uuid(), 'Moradia', 'expense', 'Home', '#f59e0b', TRUE),
(generate_uuid(), 'Saúde', 'expense', 'Heart', '#ec4899', TRUE),
(generate_uuid(), 'Educação', 'expense', 'GraduationCap', '#8b5cf6', TRUE),
(generate_uuid(), 'Lazer', 'expense', 'Gamepad2', '#6366f1', TRUE),
(generate_uuid(), 'Compras', 'expense', 'ShoppingBag', '#a855f7', TRUE),
(generate_uuid(), 'Contas', 'expense', 'Receipt', '#d946ef', TRUE);

-- Categorias de Investimento (Investment)
INSERT IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES
(generate_uuid(), 'Renda Fixa', 'investment', 'Lock', '#3b82f6', TRUE),
(generate_uuid(), 'Ações', 'investment', 'LineChart', '#0ea5e9', TRUE),
(generate_uuid(), 'Fundos', 'investment', 'PieChart', '#06b6d4', TRUE),
(generate_uuid(), 'Criptomoedas', 'investment', 'Bitcoin', '#f59e0b', TRUE);

-- Nota: INSERT IGNORE evita erros se as categorias já existirem
-- Se generate_uuid() não funcionar, o backend pode gerar os UUIDs programaticamente

