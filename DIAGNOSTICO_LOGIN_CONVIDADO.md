# Diagnóstico: Erro ao Fazer Login com Usuário Convidado

## Problema
Erro 401 Unauthorized ao tentar fazer login com usuário que foi convidado.

## Possíveis Causas

### 1. Senha Incorreta
- O usuário pode estar usando a senha errada
- Para **cadastro completo**: usar a senha que foi enviada por e-mail
- Para **pré-cadastro**: usar a senha que foi criada na página de aceitação

### 2. Hash de Senha Corrompido
- O hash da senha pode não ter sido salvo corretamente
- Verificar se o hash está no formato correto (bcrypt)

### 3. Usuário Não Criado
- O usuário pode não ter sido criado corretamente ao aceitar o convite
- Verificar se existe na tabela `users`

### 4. Problema na Verificação de Senha
- A função `password_verify` pode estar falhando
- Verificar se o hash está no formato correto

## Como Diagnosticar

### Passo 1: Executar Script SQL
Execute o script `database/verificar_usuario_convidado.sql` no phpMyAdmin, substituindo o e-mail pelo e-mail do usuário convidado.

### Passo 2: Verificar Logs do Servidor
Verifique os logs do PHP (geralmente em `C:\wamp64\logs\php_error.log` ou similar) para ver mensagens de erro detalhadas.

### Passo 3: Verificar no Banco de Dados

```sql
-- Verificar se o usuário existe
SELECT * FROM users WHERE email = 'EMAIL_DO_USUARIO';

-- Verificar o hash da senha
SELECT 
    email,
    LENGTH(password_hash) as tamanho_hash,
    SUBSTRING(password_hash, 1, 10) as inicio_hash
FROM users 
WHERE email = 'EMAIL_DO_USUARIO';

-- Verificar convites relacionados
SELECT * FROM family_invitations 
WHERE email = 'EMAIL_DO_USUARIO' 
ORDER BY created_at DESC;
```

## Soluções

### Solução 1: Resetar Senha do Usuário
Se o usuário foi criado mas a senha está incorreta, você pode resetar:

```sql
-- Gerar nova senha (substitua 'NOVA_SENHA' pela senha desejada)
UPDATE users 
SET password_hash = '$2y$10$...' -- Use password_hash('NOVA_SENHA', PASSWORD_BCRYPT)
WHERE email = 'EMAIL_DO_USUARIO';
```

**OU** use o PHP para gerar o hash:
```php
echo password_hash('NOVA_SENHA', PASSWORD_BCRYPT);
```

### Solução 2: Recriar Usuário
Se o usuário não foi criado corretamente:

1. Deletar o usuário existente (se houver)
2. Recriar o convite
3. Aceitar o convite novamente

### Solução 3: Verificar Senha do E-mail
Para usuários com **cadastro completo**:
- Verificar se a senha foi enviada corretamente no e-mail
- Verificar se o usuário está usando a senha exata do e-mail (copiar/colar)

## Melhorias Implementadas

1. **Logs Melhorados**: Adicionados logs detalhados no `handleSignIn()` para identificar problemas
2. **Validação de Hash**: Verificação se o hash do convite existe antes de criar usuário
3. **Tratamento de Erros**: Melhor feedback para o usuário sobre o que está errado

## Próximos Passos

1. Execute o script de diagnóstico
2. Verifique os logs do servidor
3. Teste fazer login novamente
4. Se o problema persistir, verifique se a senha está correta


