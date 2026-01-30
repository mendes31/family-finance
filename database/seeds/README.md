# 🌱 Sistema de Seeds - Family Finance Hub

## 📋 O que são Seeds?

Seeds são scripts SQL que inserem dados iniciais no banco de dados, como categorias padrão, dados de teste, etc.

## 🎯 Vantagens

- ✅ **Dados Iniciais**: Categorias padrão, configurações, etc.
- ✅ **Reproduzível**: Mesmos dados em qualquer ambiente
- ✅ **Testes**: Dados de teste para desenvolvimento
- ✅ **Organizado**: Seeds separados por funcionalidade

## 📁 Estrutura

```
database/seeds/
├── 001_default_categories.sql
├── 002_test_users.sql (opcional - apenas para desenvolvimento)
└── README.md
```

## 🚀 Como Usar

### Executar Seeds Manualmente (phpMyAdmin)

1. Execute os seeds na ordem numérica (001, 002...)
2. Seeds podem ser executados múltiplas vezes (usar INSERT IGNORE ou verificar existência)

### Executar Seeds via Backend (Recomendado)

O backend pode executar os seeds programaticamente ao iniciar, garantindo que os dados iniciais sempre existam.

## ⚠️ Importante

- Seeds são **idempotentes** (podem ser executados múltiplas vezes sem duplicar dados)
- Use `INSERT IGNORE` ou verifique existência antes de inserir
- Seeds de teste devem ser separados dos seeds de produção

