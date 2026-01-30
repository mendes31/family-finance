# 📁 Pasta Database

Esta pasta contém os scripts SQL para o banco de dados MySQL, organizados em migrations e seeds.

## 📋 Estrutura

```
database/
├── migrations/              # Scripts de migração versionados
│   ├── 001_create_users_table.sql
│   ├── 002_create_families_table.sql
│   ├── ... (14 migrations no total)
│   └── README.md
├── seeds/                   # Dados iniciais
│   ├── 001_default_categories.sql
│   └── README.md
├── migrations_tracker.sql   # Tabela para rastrear migrations
├── run_migrations.php       # Script para executar migrations automaticamente
├── run_seeds.php            # Script para executar seeds automaticamente
├── schema.sql               # Schema completo (legado - use migrations)
├── seed.sql                 # Seed completo (legado - use seeds/)
├── INSTALACAO.md            # Guia completo de instalação
└── README.md                # Este arquivo
```

## 🚀 Como Usar

### Método Recomendado: Migrations e Seeds

**Veja o guia completo**: `INSTALACAO.md`

**Resumo rápido:**

1. Criar banco: `CREATE DATABASE family_finance`
2. Executar migrations: `php run_migrations.php`
3. Executar seeds: `php run_seeds.php`

### Método Alternativo: Schema Completo (Legado)

Se preferir usar o schema completo de uma vez:

1. Criar banco: `CREATE DATABASE family_finance`
2. Executar `schema.sql` no phpMyAdmin
3. (Opcional) Executar `seed.sql`

## 📚 Documentação

- **INSTALACAO.md** - Guia completo de instalação
- **migrations/README.md** - Documentação das migrations
- **seeds/README.md** - Documentação dos seeds

## ⚠️ Recomendação

**Use o sistema de migrations** para:
- ✅ Melhor controle de versão
- ✅ Facilidade de instalação em novos ambientes
- ✅ Rastreamento de mudanças
- ✅ Possibilidade de rollback (futuro)

