# 📦 Sistema de Migrations - Family Finance Hub

## 📋 O que são Migrations?

Migrations são scripts SQL versionados que permitem criar e modificar a estrutura do banco de dados de forma controlada e reproduzível. Cada migration representa uma mudança específica no schema.

## 🎯 Vantagens

- ✅ **Versionamento**: Controle de versão do banco de dados
- ✅ **Reproduzível**: Mesma estrutura em qualquer ambiente
- ✅ **Rastreável**: Histórico de mudanças
- ✅ **Reversível**: Possibilidade de rollback (futuro)
- ✅ **Colaborativo**: Fácil para trabalhar em equipe

## 📁 Estrutura

```
database/
├── migrations/
│   ├── 001_create_users_table.sql
│   ├── 002_create_families_table.sql
│   ├── 003_create_profiles_table.sql
│   ├── 004_create_user_roles_table.sql
│   ├── 005_create_family_members_table.sql
│   ├── 006_create_categories_table.sql
│   ├── 007_create_credit_cards_table.sql
│   ├── 008_create_transactions_table.sql
│   ├── 009_create_budgets_table.sql
│   ├── 010_create_financial_goals_table.sql
│   ├── 011_create_alerts_table.sql
│   ├── 012_create_functions.sql
│   ├── 013_create_triggers.sql
│   └── 014_create_indexes.sql
├── seeds/
│   ├── 001_default_categories.sql
│   └── README.md
└── migration_tracker.sql
```

## 🚀 Como Usar

### Opção 1: Executar Manualmente (phpMyAdmin)

1. Execute as migrations na ordem numérica (001, 002, 003...)
2. Execute os seeds após todas as migrations

### Opção 2: Usar Script Automático (Futuro)

Um script Node.js/PHP pode ser criado para executar automaticamente todas as migrations pendentes.

## 📝 Convenções de Nomenclatura

- **Migrations**: `XXX_description.sql` (XXX = número sequencial)
- **Seeds**: `XXX_description.sql` (XXX = número sequencial)

## ⚠️ Importante

- **SEMPRE** execute as migrations na ordem numérica
- **NUNCA** modifique uma migration já executada em produção
- Crie uma **nova migration** para alterações futuras

