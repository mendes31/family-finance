# Como Corrigir o Erro "Você não pertence a uma família"

## Problema

Ao tentar salvar configurações de e-mail, você recebe o erro **403: "Você não pertence a uma família"**.

Isso acontece porque seu usuário não está registrado na tabela `family_members` do banco de dados.

## Solução Rápida (phpMyAdmin)

### Passo 1: Acesse o phpMyAdmin
1. Abra `http://localhost/phpmyadmin`
2. Selecione o banco `family_finance`

### Passo 2: Execute o Script SQL

1. Clique na aba **"SQL"**
2. Copie e cole o conteúdo do arquivo `database/corrigir_family_members.sql`
3. Clique em **"Executar"**

O script irá:
- Mostrar usuários sem família
- Mostrar famílias existentes
- Adicionar automaticamente usuários sem família à primeira família disponível
- Mostrar o resultado final

### Passo 3: Verificar

Após executar, você verá uma lista de todos os membros da família. Se seu e-mail aparecer na lista, o problema está resolvido!

## Solução Alternativa (MySQL via Terminal)

### No PowerShell (Windows):

```powershell
# Opção 1: Usar Get-Content
Get-Content database\corrigir_family_members.sql | mysql -u root -p family_finance

# Opção 2: Usar o script .bat
.\database\corrigir_family_members.bat
```

### No CMD (Windows):

```cmd
mysql -u root -p family_finance < database\corrigir_family_members.sql
```

### No Linux/Mac:

```bash
mysql -u root -p family_finance < database/corrigir_family_members.sql
```

## Solução Manual (Se Precisar de Mais Controle)

### 1. Encontre seu user_id e family_id:

```sql
-- Substitua 'SEU_EMAIL@exemplo.com' pelo seu e-mail
SELECT 
    u.id as user_id,
    u.email,
    f.id as family_id,
    f.name as family_name
FROM users u
CROSS JOIN families f
WHERE u.email = 'SEU_EMAIL@exemplo.com'
LIMIT 1;
```

### 2. Adicione-se à família:

```sql
-- Substitua 'USER_ID_AQUI' e 'FAMILY_ID_AQUI' pelos valores obtidos acima
INSERT INTO family_members (id, family_id, user_id, joined_at)
VALUES (UUID(), 'FAMILY_ID_AQUI', 'USER_ID_AQUI', NOW());
```

**⚠️ IMPORTANTE:** Substitua os placeholders pelos valores reais obtidos na query anterior!

## Verificação

Para verificar se você está na tabela `family_members`:

```sql
SELECT 
    u.email,
    u.full_name,
    f.name as family_name,
    fm.joined_at
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
INNER JOIN families f ON f.id = fm.family_id
WHERE u.email = 'SEU_EMAIL@exemplo.com';
```

Se retornar uma linha, você está na família! 🎉

## Após a Correção

1. **Faça logout e login novamente** no sistema
2. Tente **salvar as configurações de e-mail** novamente
3. O erro 403 não deve mais ocorrer

## Se Ainda Não Funcionar

1. Verifique se você tem uma família criada:
   ```sql
   SELECT * FROM families;
   ```

2. Se não houver família, crie uma pelo sistema (página "Família")

3. Se houver família mas você não estiver nela, execute o script de correção novamente


