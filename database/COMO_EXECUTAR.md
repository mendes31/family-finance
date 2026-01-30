# 🚀 Como Executar os Scripts - Windows/PowerShell

## ⚠️ Problema Comum

No PowerShell, você não pode executar arquivos PHP diretamente. É necessário usar o comando `php` antes do nome do arquivo.

---

## ✅ Solução: Comandos Corretos

### ⚠️ IMPORTANTE: O arquivo está na pasta `database/`

Você precisa navegar até a pasta `database/` primeiro ou usar o caminho completo.

### Opção 1: Navegar até a pasta database (RECOMENDADO)

```powershell
# 1. Você está em: C:\wamp64\www\family_finance
# 2. Navegar até a pasta database
cd database

# 3. Agora você está em: C:\wamp64\www\family_finance\database
# 4. Executar migrations
php run_migrations.php

# 5. Executar seeds (opcional)
php run_seeds.php
```

### Opção 2: Executar direto da raiz do projeto

```powershell
# Você está em: C:\wamp64\www\family_finance
# Use o caminho relativo:
php database/run_migrations.php

# Ou seeds:
php database/run_seeds.php
```

---

## 🔍 Verificar se PHP está no PATH

Se você receber erro "php não é reconhecido", o PHP pode não estar no PATH do sistema.

### Verificar se PHP está instalado:

```powershell
php -v
```

Se não funcionar, você precisa:

1. **Adicionar PHP ao PATH** ou
2. **Usar o caminho completo do PHP do WAMP**

### Usar PHP do WAMP diretamente:

```powershell
# Substitua pela versão do seu PHP (pode ser php7.4, php8.0, php8.1, etc.)
C:\wamp64\bin\php\php8.1.0\php.exe database/run_migrations.php
```

Para descobrir qual versão você tem, verifique em:
`C:\wamp64\bin\php\`

---

## 📝 Exemplo Completo Passo a Passo

```powershell
# 1. Você já está na pasta do projeto: C:\wamp64\www\family_finance
#    (Você pode ver isso no prompt: PS C:\wamp64\www\family_finance>)

# 2. Verificar se PHP funciona
php -v

# 3. Navegar até a pasta database (IMPORTANTE!)
cd database

# 4. Agora você está em: C:\wamp64\www\family_finance\database
#    (O prompt deve mostrar: PS C:\wamp64\www\family_finance\database>)

# 5. Executar migrations
php run_migrations.php

# Você deve ver algo como:
# ✅ Conectado ao banco de dados: family_finance
# ✅ Tabela de migrations criada/verificada
# 🔄 Executando: 001_create_users_table.sql
# ✅ Sucesso: 001_create_users_table.sql
# ... (e assim por diante)

# 5. Executar seeds (opcional)
php run_seeds.php
```

---

## 🛠️ Alternativa: Usar phpMyAdmin (Manual)

Se os scripts PHP não funcionarem, você pode executar as migrations manualmente:

1. Abra o phpMyAdmin: `http://localhost/phpmyadmin`
2. Selecione o banco `family_finance`
3. Clique na aba **"SQL"**
4. Execute cada arquivo da pasta `migrations/` na ordem (001, 002, 003...)

Veja o guia completo em: `INSTALACAO.md`

---

## ⚠️ Erros Comuns

### Erro: "php não é reconhecido"

**Solução**: Adicione PHP ao PATH ou use o caminho completo do WAMP.

### Erro: "Access denied"

**Solução**: 
1. Crie/edite o arquivo `.env` **na raiz do projeto** (não na pasta database):
   ```ini
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_aqui
   DB_NAME=family_finance
   ```
2. Ou edite diretamente os valores nos scripts `run_migrations.php` e `run_seeds.php`

**Veja mais**: `../CONFIGURACAO_ENV.md` na raiz do projeto

### Erro: "Unknown database"

**Solução**: Crie o banco `family_finance` primeiro no phpMyAdmin.

---

## 📚 Mais Informações

- **Guia completo de instalação**: `INSTALACAO.md`
- **Documentação das migrations**: `migrations/README.md`
- **Documentação dos seeds**: `seeds/README.md`

