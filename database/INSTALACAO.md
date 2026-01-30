# 🚀 Guia de Instalação - Family Finance Hub

## 📋 Pré-requisitos

- ✅ WAMP instalado e funcionando
- ✅ MySQL rodando
- ✅ phpMyAdmin acessível
- ✅ PHP CLI disponível (para scripts automáticos)

---

## 🎯 Método 1: Instalação Automática (Recomendado)

### Passo 1: Criar o Banco de Dados

1. Acesse o phpMyAdmin: `http://localhost/phpmyadmin`
2. Clique em **"Novo"** no menu lateral
3. Nome: `family_finance`
4. Collation: `utf8mb4_unicode_ci`
5. Clique em **"Criar"**

### Passo 2: Executar Migrations

**No PowerShell/Windows:**

```powershell
# Navegar até a pasta database
cd database

# Executar migrations
php run_migrations.php
```

**Ou da raiz do projeto:**

```powershell
php database/run_migrations.php
```

**Nota**: Se `php` não for reconhecido, use o caminho completo do PHP do WAMP:
```powershell
C:\wamp64\bin\php\php8.1.0\php.exe database/run_migrations.php
```
(Substitua `php8.1.0` pela versão do seu PHP)

**O que faz:**
- ✅ Cria todas as tabelas na ordem correta
- ✅ Cria funções e stored procedures
- ✅ Cria triggers
- ✅ Cria índices
- ✅ Registra quais migrations foram executadas

### Passo 3: Executar Seeds (Opcional)

```powershell
# Se estiver na pasta database
php run_seeds.php

# Ou da raiz do projeto
php database/run_seeds.php
```

**O que faz:**
- ✅ Insere categorias padrão
- ✅ Insere outros dados iniciais

**Pronto!** O banco está configurado.

---

## 🎯 Método 2: Instalação Manual (phpMyAdmin)

### Passo 1: Criar o Banco de Dados

1. Acesse o phpMyAdmin: `http://localhost/phpmyadmin`
2. Clique em **"Novo"** no menu lateral
3. Nome: `family_finance`
4. Collation: `utf8mb4_unicode_ci`
5. Clique em **"Criar"**

### Passo 2: Criar Tabela de Controle

1. Selecione o banco `family_finance`
2. Clique na aba **"SQL"**
3. Execute o arquivo `migrations_tracker.sql`

### Passo 3: Executar Migrations na Ordem

Execute cada arquivo na pasta `migrations/` **na ordem numérica**:

1. `001_create_users_table.sql`
2. `002_create_families_table.sql`
3. `003_create_profiles_table.sql`
4. `004_create_user_roles_table.sql`
5. `005_create_family_members_table.sql`
6. `006_create_categories_table.sql`
7. `007_create_credit_cards_table.sql`
8. `008_create_transactions_table.sql`
9. `009_create_budgets_table.sql`
10. `010_create_financial_goals_table.sql`
11. `011_create_alerts_table.sql`
12. `012_create_functions.sql`
13. `013_create_triggers.sql`
14. `014_create_indexes.sql`

**Como executar cada migration:**
1. Selecione o banco `family_finance`
2. Clique na aba **"SQL"**
3. Abra o arquivo da migration
4. Copie todo o conteúdo
5. Cole no campo SQL
6. Clique em **"Executar"**

### Passo 4: Executar Seeds (Opcional)

Execute os arquivos na pasta `seeds/` na ordem:

1. `001_default_categories.sql`

---

## 🔍 Verificar Instalação

### Verificar Tabelas

1. No phpMyAdmin, selecione o banco `family_finance`
2. Você deve ver **11 tabelas**:
   - `users`
   - `families`
   - `profiles`
   - `user_roles`
   - `family_members`
   - `categories`
   - `credit_cards`
   - `transactions`
   - `budgets`
   - `financial_goals`
   - `alerts`
   - `migrations` (tabela de controle)

### Verificar Categorias (se executou seeds)

1. Clique na tabela `categories`
2. Clique na aba **"Visualizar"**
3. Você deve ver 16 categorias padrão

---

## ⚙️ Configuração do Banco de Dados

### Arquivo .env (Opcional, mas Recomendado)

Os scripts leem o arquivo `.env` **na raiz do projeto** (não na pasta database).

**Como configurar:**
1. Copie `.env.example` para `.env` na raiz do projeto
2. Ajuste as configurações do banco de dados:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=family_finance
   ```

**Valores padrão** (se não criar o `.env`):
- Host: `localhost`
- Usuário: `root`
- Senha: (vazia)
- Banco: `family_finance`

**Documentação completa**: Veja `../CONFIGURACAO_ENV.md` na raiz do projeto

---

## ⚠️ Problemas Comuns

### Erro: "Table already exists"

**Causa**: A migration já foi executada anteriormente.

**Solução**: 
- Se usar script automático: ele pula migrations já executadas
- Se usar manual: pule a migration que já existe

### Erro: "Function already exists"

**Causa**: A função já foi criada.

**Solução**: 
- As migrations usam `DROP FUNCTION IF EXISTS`, então devem funcionar
- Se persistir, execute manualmente: `DROP FUNCTION nome_da_funcao;`

### Erro: "Unknown database"

**Causa**: O banco não foi criado.

**Solução**: Crie o banco primeiro (Passo 1).

### Erro: "Access denied"

**Causa**: Credenciais incorretas do MySQL.

**Solução**: 
1. Crie o arquivo `.env` na pasta `database/` com suas credenciais
2. Ou edite diretamente os scripts `run_migrations.php` e `run_seeds.php`

**Veja mais**: `CONFIGURACAO.md`

### Erro: "Foreign key constraint fails"

**Causa**: Ordem incorreta de execução das migrations.

**Solução**: Execute as migrations na ordem numérica (001, 002, 003...).

---

## 📝 Notas Importantes

1. **Ordem é importante**: Sempre execute as migrations na ordem numérica
2. **Migrations são idempotentes**: Podem ser executadas múltiplas vezes (usam `IF NOT EXISTS`)
3. **Seeds são idempotentes**: Usam `INSERT IGNORE` para evitar duplicatas
4. **UUIDs**: As migrations usam `generate_uuid()`. Se não funcionar, o backend deve gerar os UUIDs

---

## 🔄 Reinstalação

Se precisar reinstalar do zero:

```sql
DROP DATABASE family_finance;
CREATE DATABASE family_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Depois execute as migrations novamente.

---

## 📚 Próximos Passos

Após instalar o banco:

1. ✅ Configurar o backend (Node.js + Express)
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar conexão com o banco
4. ✅ Iniciar desenvolvimento

---

**Última atualização**: 30 de dezembro de 2024

