# Funcionalidade de Convites de Membros

## ✅ Implementado

### 1. Banco de Dados
- ✅ Tabela `family_invitations` criada (migration 021)
- ✅ Campos: email, nome, perfil (user/admin), tipo de cadastro, token, senha (hash), status, expiração

### 2. Backend (API)
- ✅ `handleInviteMember()` - Criar convite
- ✅ `handleGetInvitations()` - Listar convites pendentes
- ✅ `handleCancelInvitation()` - Cancelar convite
- ✅ `handleAcceptInvitation()` - Aceitar convite
- ✅ Geração de senha aleatória para cadastro completo
- ✅ Validações de segurança (verificar se já é membro, convites duplicados, etc.)

### 3. Frontend
- ✅ Modal `InviteMemberModal` com:
  - Seleção de tipo de cadastro (pré-cadastro ou completo)
  - Campo de e-mail
  - Campo de nome (obrigatório para cadastro completo)
  - Seleção de perfil (Usuário ou Administrador)
- ✅ Página `Family.tsx` atualizada:
  - Botão "Convidar membro" funcional
  - Lista de convites pendentes
  - Opção de cancelar convites
- ✅ Hooks React Query:
  - `useInviteMember()` - Criar convite
  - `useFamilyInvitations()` - Listar convites
  - `useCancelInvitation()` - Cancelar convite

## ⚠️ Pendente

### Envio de E-mail
O envio de e-mail com credenciais ainda não está implementado. Atualmente, as informações são apenas logadas no servidor.

**Para implementar o envio de e-mail, você precisa:**

1. **Configurar SMTP no `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_FROM=noreply@finfamily.com
SMTP_FROM_NAME=FinFamily
```

2. **Criar função de envio de e-mail em `api/config.php`:**
```php
function send_invitation_email($email, $full_name, $token, $password, $invitation_type) {
    // Implementar usando PHPMailer ou similar
    // Enviar link de aceitação ou credenciais
}
```

3. **Atualizar `handleInviteMember()` em `api/family.php`:**
   - Descomentar a linha: `send_invitation_email(...)`
   - Remover logs de senha em produção

## 📋 Como Usar

### Convidar um Membro

1. Acesse a página **Família**
2. Clique em **"Convidar membro"**
3. Preencha o formulário:
   - **Tipo de Cadastro:**
     - **Pré-cadastro**: Apenas e-mail e nome. O membro completa o cadastro depois.
     - **Cadastro Completo**: Cadastro completo com senha gerada. Credenciais serão enviadas por e-mail.
   - **E-mail**: E-mail do novo membro
   - **Nome Completo**: Obrigatório para cadastro completo
   - **Perfil**: Usuário ou Administrador
4. Clique em **"Enviar Convite"**

### Gerenciar Convites

- **Ver convites pendentes**: Aparecem na seção "Convites Pendentes" na página Família
- **Cancelar convite**: Clique no ícone X ao lado do convite

### Aceitar Convite

O membro convidado precisa:
1. Acessar o link de convite (quando o e-mail estiver implementado)
2. Ou usar a API diretamente: `POST /api/family.php?action=accept_invitation`
   - Body: `{ "token": "token_do_convite", "password": "senha" }` (para pré-cadastro)

## 🔒 Segurança

- ✅ Tokens únicos gerados com `random_bytes(32)`
- ✅ Senhas hashadas com `password_hash()` (BCRYPT)
- ✅ Validação de expiração (7 dias)
- ✅ Verificação de duplicatas (e-mail já membro ou convite pendente)
- ✅ Transações atômicas no banco de dados
- ⚠️ Em produção, remover retorno de senha e token na resposta da API

## 📝 Notas

- A senha gerada é retornada na resposta apenas em desenvolvimento (para testes)
- O token do convite também é retornado (remover em produção)
- Convites expiram em 7 dias
- Um e-mail só pode ter um convite pendente por família




