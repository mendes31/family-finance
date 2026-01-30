    # 🗄️ Guia Prático: Criar Banco de Dados no phpMyAdmin

## 📋 Pré-requisitos

- ✅ WAMP instalado e funcionando
- ✅ MySQL rodando (ícone verde no WAMP)
- ✅ phpMyAdmin acessível

---

## 🚀 Passo a Passo: Criar Banco de Dados

### 1. Acessar o phpMyAdmin

1. Abra seu navegador
2. Acesse: `http://localhost/phpmyadmin`
3. Faça login (geralmente):
   - **Usuário**: `root`
   - **Senha**: (deixe vazio ou use a senha que você configurou)

### 2. Criar o Banco de Dados

#### Opção A: Via Interface Gráfica (Mais Fácil)

1. No menu lateral esquerdo, clique em **"Novo"** ou **"New"**
2. No campo **"Nome do banco de dados"**, digite: `family_finance`
3. No campo **"Collation"**, selecione: `utf8mb4_unicode_ci`
4. Clique no botão **"Criar"** ou **"Create"**
5. Pronto! O banco foi criado.

#### Opção B: Via SQL (Alternativa)

1. Clique na aba **"SQL"** no topo
2. Cole o seguinte comando:

```sql
CREATE DATABASE family_finance 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

3. Clique em **"Executar"** ou **"Go"**
4. Pronto! O banco foi criado.

### 3. Verificar Criação

1. No menu lateral esquerdo, você deve ver o banco `family_finance`
2. Clique nele para selecioná-lo
3. Você verá uma mensagem: "Nenhuma tabela encontrada" (isso é normal, ainda não criamos as tabelas)

---

## 🔐 Criar Usuário Específico (Opcional, mas Recomendado)

### Por que criar um usuário específico?

- ✅ Mais seguro (não usar root em produção)
- ✅ Melhor organização
- ✅ Facilita backup e migração

### Como criar:

1. No phpMyAdmin, clique na aba **"SQL"**
2. Cole o seguinte código (substitua `senha_segura_aqui` por uma senha forte):

```sql
-- Criar usuário
CREATE USER 'family_finance_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';

-- Dar todas as permissões no banco
GRANT ALL PRIVILEGES ON family_finance.* TO 'family_finance_user'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;
```

3. Clique em **"Executar"**
4. Pronto! Agora você pode usar este usuário no backend.

**Nota**: Se preferir usar o usuário `root`, pode pular este passo.

---

## 📊 Próximos Passos: Criar as Tabelas

Após criar o banco, você precisará executar o script SQL que cria todas as tabelas.

### Onde encontrar o script?

O script SQL será criado na pasta `database/schema.sql` (será criado na próxima fase do desenvolvimento).

### Como executar o script:

1. Selecione o banco `family_finance` no menu lateral
2. Clique na aba **"SQL"**
3. Abra o arquivo `database/schema.sql` em um editor de texto
4. Cole todo o conteúdo no campo SQL
5. Clique em **"Executar"**
6. Verifique se todas as tabelas foram criadas (você deve ver 10 tabelas)

---

## 🔍 Verificar Estrutura do Banco

### Ver todas as tabelas:

1. Selecione o banco `family_finance`
2. Você verá todas as tabelas listadas
3. Clique em uma tabela para ver sua estrutura

### Ver estrutura de uma tabela:

1. Selecione o banco `family_finance`
2. Clique no nome da tabela
3. Clique na aba **"Estrutura"** ou **"Structure"**
4. Você verá todas as colunas, tipos, chaves, etc.

---

## 🛠️ Comandos SQL Úteis

### Ver todas as tabelas:
```sql
SHOW TABLES;
```

### Ver estrutura de uma tabela:
```sql
DESCRIBE nome_da_tabela;
```

### Ver todos os bancos de dados:
```sql
SHOW DATABASES;
```

### Deletar banco de dados (CUIDADO!):
```sql
DROP DATABASE family_finance;
```

### Limpar todas as tabelas (CUIDADO!):
```sql
-- Isso deleta todas as tabelas do banco
DROP DATABASE family_finance;
CREATE DATABASE family_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 📝 Configuração para o Backend

### Credenciais do Banco (para usar no backend):

**Se usar root:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=family_finance
```

**Se usar usuário específico:**
```env
DB_HOST=localhost
DB_USER=family_finance_user
DB_PASSWORD=senha_segura_aqui
DB_NAME=family_finance
```

---

## ⚠️ Problemas Comuns

### 1. Erro: "Access denied for user"

**Solução**: Verifique se o usuário e senha estão corretos. Se estiver usando root, tente deixar a senha vazia.

### 2. Erro: "Unknown database"

**Solução**: Certifique-se de que o banco `family_finance` foi criado e está selecionado.

### 3. Erro: "Table already exists"

**Solução**: As tabelas já existem. Se quiser recriar, delete o banco e crie novamente (CUIDADO: isso apaga todos os dados!).

### 4. phpMyAdmin não abre

**Solução**: 
- Verifique se o WAMP está rodando (ícone verde)
- Verifique se o Apache está rodando
- Tente acessar: `http://127.0.0.1/phpmyadmin`

### 5. Caracteres especiais aparecem errados

**Solução**: Certifique-se de que o banco usa `utf8mb4_unicode_ci` como collation.

---

## 🎯 Checklist

- [ ] WAMP instalado e funcionando
- [ ] phpMyAdmin acessível
- [ ] Banco `family_finance` criado
- [ ] Collation `utf8mb4_unicode_ci` configurada
- [ ] Usuário específico criado (opcional)
- [ ] Pronto para executar o schema SQL

---

## 📚 Recursos Adicionais

- [Documentação phpMyAdmin](https://www.phpmyadmin.net/docs/)
- [Documentação MySQL](https://dev.mysql.com/doc/)
- [Tutorial WAMP](https://www.wampserver.com/en/)

---

**Próximo passo**: Aguardar a criação do arquivo `database/schema.sql` para executar e criar todas as tabelas.

