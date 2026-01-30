-- ============================================
-- Family Finance Hub - Seed Alternativo (Sem função UUID)
-- Use este arquivo se generate_uuid() não funcionar
-- ============================================

USE family_finance;

-- ============================================
-- CATEGORIAS PADRÃO DO SISTEMA
-- ============================================
-- Esta versão deixa o campo 'id' vazio para o MySQL gerar automaticamente
-- OU você pode inserir UUIDs gerados manualmente

-- IMPORTANTE: Se a coluna 'id' não permite NULL, você precisa:
-- 1. Gerar UUIDs manualmente (use um gerador online)
-- 2. Ou deixar o backend inserir essas categorias

-- Exemplo com UUIDs fixos (substitua pelos seus próprios UUIDs):
-- Você pode gerar UUIDs em: https://www.uuidgenerator.net/

-- Categorias de Receita (Income)
INSERT INTO categories (id, name, type, icon, color, is_default) VALUES
('00000000-0000-0000-0000-000000000001', 'Salário', 'income', 'Briefcase', '#22c55e', TRUE),
('00000000-0000-0000-0000-000000000002', 'Freelance', 'income', 'Laptop', '#10b981', TRUE),
('00000000-0000-0000-0000-000000000003', 'Investimentos', 'income', 'TrendingUp', '#14b8a6', TRUE),
('00000000-0000-0000-0000-000000000004', 'Outros', 'income', 'Plus', '#06b6d4', TRUE);

-- Categorias de Despesa (Expense)
INSERT INTO categories (id, name, type, icon, color, is_default) VALUES
('00000000-0000-0000-0000-000000000005', 'Alimentação', 'expense', 'UtensilsCrossed', '#ef4444', TRUE),
('00000000-0000-0000-0000-000000000006', 'Transporte', 'expense', 'Car', '#f97316', TRUE),
('00000000-0000-0000-0000-000000000007', 'Moradia', 'expense', 'Home', '#f59e0b', TRUE),
('00000000-0000-0000-0000-000000000008', 'Saúde', 'expense', 'Heart', '#ec4899', TRUE),
('00000000-0000-0000-0000-000000000009', 'Educação', 'expense', 'GraduationCap', '#8b5cf6', TRUE),
('00000000-0000-0000-0000-00000000000a', 'Lazer', 'expense', 'Gamepad2', '#6366f1', TRUE),
('00000000-0000-0000-0000-00000000000b', 'Compras', 'expense', 'ShoppingBag', '#a855f7', TRUE),
('00000000-0000-0000-0000-00000000000c', 'Contas', 'expense', 'Receipt', '#d946ef', TRUE);

-- Categorias de Investimento (Investment)
INSERT INTO categories (id, name, type, icon, color, is_default) VALUES
('00000000-0000-0000-0000-00000000000d', 'Renda Fixa', 'investment', 'Lock', '#3b82f6', TRUE),
('00000000-0000-0000-0000-00000000000e', 'Ações', 'investment', 'LineChart', '#0ea5e9', TRUE),
('00000000-0000-0000-0000-00000000000f', 'Fundos', 'investment', 'PieChart', '#06b6d4', TRUE),
('00000000-0000-0000-0000-000000000010', 'Criptomoedas', 'investment', 'Bitcoin', '#f59e0b', TRUE);

-- ============================================
-- FIM DO SEED ALTERNATIVO
-- ============================================
-- Nota: Estes UUIDs são apenas exemplos. Em produção, use UUIDs únicos gerados adequadamente.

