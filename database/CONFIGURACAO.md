# ⚙️ Configuração do Banco de Dados

## 📋 Arquivo .env

Os scripts de migrations e seeds (`run_migrations.php` e `run_seeds.php`) **leem o arquivo `.env` da raiz do projeto**.

**✅ Agora há um único arquivo `.env` na raiz** que contém todas as configurações:
- Banco de dados (MySQL)
- Backend API
- Frontend (Vite)

**Veja a documentação completa**: `../CONFIGURACAO_ENV.md`

### Como Configurar

1. **Copie o arquivo de exemplo:**
   ```powershell
   # Na pasta database/
   copy env.example .env
   ```

2. **Edite o arquivo `.env`** com suas configurações:
   ```ini
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=family_finance
   ```

3. **Ajuste os valores conforme necessário:**
   - `DB_HOST`: Host do MySQL (geralmente `localhost`)
   - `DB_USER`: Usuário do MySQL (geralmente `root`)
   - `DB_PASSWORD`: Senha do MySQL (deixe vazio se não tiver)
   - `DB_NAME`: Nome do banco de dados (`family_finance`)

### Valores Padrão

Se o arquivo `.env` **não existir**, os scripts usam estes valores padrão:
- `DB_HOST=localhost`
- `DB_USER=root`
- `DB_PASSWORD=` (vazio)
- `DB_NAME=family_finance`

### ⚠️ Importante

- **NÃO commite o arquivo `.env`** no Git (ele contém informações sensíveis)
- O arquivo `env.example` pode ser commitado (é apenas um template)
- Se você não criar o `.env`, os scripts funcionarão com os valores padrão

---

## 🔧 Alternativa: Editar Diretamente nos Scripts

Se preferir, você pode editar diretamente os valores nos arquivos:

- `run_migrations.php` (linhas 8-11)
- `run_seeds.php` (linhas 8-11)

---

## 📝 Exemplo de Uso

### Criar o arquivo .env:

```powershell
# Na pasta database/
cd database

# Criar arquivo .env (Windows PowerShell)
@"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=family_finance
"@ | Out-File -FilePath .env -Encoding utf8
```

### Ou editar manualmente:

1. Crie um arquivo chamado `.env` na pasta `database/`
2. Cole o conteúdo:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=family_finance
   ```
3. Salve o arquivo

---

## ✅ Verificar Configuração

Após criar o `.env`, execute os scripts normalmente:

```powershell
cd database
php run_migrations.php
```

Os scripts irão:
1. Procurar o arquivo `.env`
2. Se encontrar, usar as configurações dele
3. Se não encontrar, usar os valores padrão

---

## 🔐 Segurança

- **Nunca commite** o arquivo `.env` no Git
- Adicione `.env` ao `.gitignore`:
  ```
  database/.env
  ```
- Use `env.example` como template para outros desenvolvedores

