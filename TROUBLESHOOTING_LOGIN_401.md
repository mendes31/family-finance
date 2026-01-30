# Troubleshooting: Erro 401 ao Fazer Login

## Problema
Erro `401 Unauthorized` ao tentar fazer login após aceitar convite.

## Possíveis Causas

### 1. Usuário Não Foi Criado
- O convite foi aceito mas houve erro na criação do usuário
- **Solução**: Execute `database/verificar_usuario_apos_aceitar.sql` para verificar

### 2. Senha Incorreta
- Para **cadastro completo (`full_register`)**: Você DEVE usar a senha exata que foi enviada por e-mail
- **IMPORTANTE**: Copie e cole a senha do e-mail (não digite manualmente)
- Verifique se não há espaços extras antes ou depois da senha

### 3. Convite Não Foi Aceito
- O usuário está tentando fazer login sem ter aceitado o convite
- **Solução**: Acesse o link de aceitação primeiro

### 4. Hash de Senha Corrompido
- O hash da senha pode não ter sido salvo corretamente
- **Solução**: Execute o script de verificação

## Passos para Diagnosticar

### Passo 1: Verificar se o Usuário Existe

Execute no phpMyAdmin:
```sql
SELECT * FROM users WHERE email = 'SEU_EMAIL_AQUI';
```

**Se não retornar nada**: O usuário não foi criado. Você precisa aceitar o convite primeiro.

### Passo 2: Verificar o Convite

```sql
SELECT 
    id, email, invitation_type, status, accepted_at, expires_at
FROM family_invitations
WHERE email = 'SEU_EMAIL_AQUI'
ORDER BY created_at DESC
LIMIT 1;
```

**Verifique**:
- `status` deve ser `'accepted'`
- `accepted_at` não deve ser `NULL`
- `expires_at` deve ser no futuro

### Passo 3: Verificar a Senha

Para **cadastro completo (`full_register`)**:
1. Abra o e-mail de convite
2. Localize a senha (está em uma caixa destacada)
3. **Copie a senha completa** (incluindo todos os caracteres)
4. **Cole no campo de senha** (não digite)

**Dicas**:
- A senha geralmente tem 12 caracteres
- Pode conter letras maiúsculas, minúsculas, números e símbolos
- Exemplo: `Kx9#mP2$vL8@`

### Passo 4: Verificar Logs do Servidor

Verifique os logs do PHP:
- Windows: `C:\wamp64\logs\php_error.log`
- Procure por mensagens como:
  - "Login falhou: Usuário não encontrado"
  - "Login falhou: Senha incorreta"

## Soluções

### Solução 1: Reenviar Convite

Se você não tem mais o e-mail com a senha:

1. Vá para a página **Família**
2. Encontre o convite pendente
3. Clique no botão de **Reenviar** (ícone de rotação)
4. Verifique o novo e-mail com a nova senha

### Solução 2: Resetar Senha Manualmente

Se você tem acesso ao banco de dados:

1. Execute no phpMyAdmin:
```sql
-- Gerar novo hash de senha (substitua 'NOVA_SENHA' pela senha desejada)
SELECT password_hash('NOVA_SENHA', PASSWORD_BCRYPT) as novo_hash;
```

2. Copie o hash gerado e atualize:
```sql
UPDATE users 
SET password_hash = 'HASH_GERADO_AQUI'
WHERE email = 'SEU_EMAIL_AQUI';
```

### Solução 3: Recriar Usuário

Se o usuário foi criado incorretamente:

1. **Cancelar convite antigo** (se ainda estiver pendente)
2. **Deletar usuário** (se existir):
```sql
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'SEU_EMAIL');
DELETE FROM family_members WHERE user_id IN (SELECT id FROM users WHERE email = 'SEU_EMAIL');
DELETE FROM profiles WHERE id IN (SELECT id FROM users WHERE email = 'SEU_EMAIL');
DELETE FROM users WHERE email = 'SEU_EMAIL';
```

3. **Criar novo convite**
4. **Aceitar o convite novamente**

## Checklist de Verificação

Antes de tentar fazer login, verifique:

- [ ] O convite foi aceito? (`status = 'accepted'`)
- [ ] O usuário existe na tabela `users`?
- [ ] O perfil foi criado na tabela `profiles`?
- [ ] A role foi atribuída na tabela `user_roles`?
- [ ] O usuário foi adicionado à família em `family_members`?
- [ ] Você está usando a senha correta do e-mail?
- [ ] Você copiou/colou a senha (não digitou manualmente)?
- [ ] Não há espaços extras na senha?

## Teste Rápido

Execute este script SQL para verificar tudo de uma vez:

```sql
USE family_finance;

SELECT 
    'Usuário' as tipo,
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM users WHERE email = 'SEU_EMAIL_AQUI'

UNION ALL

SELECT 
    'Perfil' as tipo,
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM profiles p
INNER JOIN users u ON u.id = p.id
WHERE u.email = 'SEU_EMAIL_AQUI'

UNION ALL

SELECT 
    'Role' as tipo,
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM user_roles ur
INNER JOIN users u ON u.id = ur.user_id
WHERE u.email = 'SEU_EMAIL_AQUI'

UNION ALL

SELECT 
    'Família' as tipo,
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ Não existe' END as status
FROM family_members fm
INNER JOIN users u ON u.id = fm.user_id
WHERE u.email = 'SEU_EMAIL_AQUI'

UNION ALL

SELECT 
    'Convite Aceito' as tipo,
    CASE WHEN COUNT(*) > 0 THEN '✅ Aceito' ELSE '❌ Não aceito' END as status
FROM family_invitations
WHERE email = 'SEU_EMAIL_AQUI' AND status = 'accepted';
```

## Próximos Passos

1. Execute o script `database/verificar_usuario_apos_aceitar.sql`
2. Verifique os resultados
3. Se o usuário não existe, aceite o convite novamente
4. Se o usuário existe mas a senha não funciona, reenvie o convite ou resete a senha
5. Tente fazer login novamente


