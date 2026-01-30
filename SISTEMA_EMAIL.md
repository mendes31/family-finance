# Sistema de Envio de E-mails

## ✅ Implementado

### 1. PHPMailer
- ✅ Instalado via Composer (`composer.json`)
- ✅ Autoload configurado em `api/config.php`

### 2. Funções de E-mail
- ✅ `send_email()` - Função genérica para enviar e-mails usando PHPMailer
- ✅ `get_email_settings()` - Busca configurações SMTP da família
- ✅ `send_invitation_email()` - Envia e-mail de convite com templates HTML

### 3. Integração
- ✅ **Configuração SMTP** (`api/email_settings.php`):
  - Teste de e-mail funcional usando PHPMailer
  - Validação de configurações antes de salvar
  
- ✅ **Convites de Membros** (`api/family.php`):
  - Envio automático de e-mail ao criar convite
  - Templates diferentes para pré-cadastro e cadastro completo
  - Tratamento de erros (convite é criado mesmo se e-mail falhar)

### 4. Templates de E-mail
- ✅ **Convite com Cadastro Completo**: Inclui credenciais (e-mail e senha)
- ✅ **Convite com Pré-cadastro**: Apenas link de aceitação
- ✅ Templates HTML responsivos com estilização
- ✅ Versão texto alternativo para clientes sem suporte HTML

## 📋 Como Usar

### 1. Configurar SMTP

1. Acesse **Configurações > E-mail**
2. Preencha os dados do servidor SMTP:
   - **Servidor SMTP**: Ex: `smtp.gmail.com`
   - **Porta**: Ex: `587` (TLS) ou `465` (SSL)
   - **Criptografia**: TLS ou SSL
   - **Usuário**: Seu e-mail SMTP
   - **Senha**: Senha do e-mail ou senha de app (Gmail)
   - **E-mail Remetente**: E-mail que aparecerá como remetente
   - **Nome Remetente**: Nome que aparecerá como remetente

3. Clique em **"Testar Configuração"** para verificar se está funcionando
4. Clique em **"Salvar"** para salvar as configurações

### 2. Enviar Convites

1. Acesse **Família > Convidar Membro**
2. Preencha o formulário:
   - **Tipo de Cadastro**:
     - **Pré-cadastro**: E-mail com link de aceitação
     - **Cadastro Completo**: E-mail com credenciais (e-mail + senha)
   - **E-mail**: E-mail do novo membro
   - **Nome Completo**: Obrigatório para cadastro completo
   - **Perfil**: Usuário ou Administrador

3. Clique em **"Enviar Convite"**
4. O sistema irá:
   - Criar o convite no banco de dados
   - Enviar automaticamente o e-mail com as informações
   - Retornar status do envio (sucesso ou erro)

## 🔧 Configurações Comuns

### Gmail
```
Servidor SMTP: smtp.gmail.com
Porta: 587 (TLS) ou 465 (SSL)
Criptografia: TLS ou SSL
Usuário: seu-email@gmail.com
Senha: Senha de app do Gmail (não a senha da conta)
```

**Como criar senha de app no Gmail:**
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "E-mail" e "Outro (nome personalizado)"
3. Digite "FinFamily" e clique em "Gerar"
4. Use a senha gerada no campo "Senha SMTP"

### Outlook/Hotmail
```
Servidor SMTP: smtp-mail.outlook.com
Porta: 587
Criptografia: TLS
Usuário: seu-email@outlook.com
Senha: Sua senha da conta
```

### Yahoo
```
Servidor SMTP: smtp.mail.yahoo.com
Porta: 587 (TLS) ou 465 (SSL)
Criptografia: TLS ou SSL
Usuário: seu-email@yahoo.com
Senha: Sua senha da conta
```

## 🔒 Segurança

### Senha SMTP
- A senha é criptografada usando `base64_encode()` antes de salvar no banco
- **Melhorias futuras**: Usar `openssl_encrypt()` com chave do `.env`

### Tokens de Convite
- Tokens únicos gerados com `random_bytes(32)`
- Expiração de 7 dias
- Links seguros com token na URL

### Em Produção
- Remover retorno de senha e token na resposta da API
- Adicionar constante `ENVIRONMENT` no `.env`:
  ```env
  ENVIRONMENT=production
  ```

## 🐛 Troubleshooting

### E-mail não está sendo enviado

1. **Verifique as configurações SMTP**:
   - Teste a configuração usando o botão "Testar Configuração"
   - Verifique se o servidor, porta e credenciais estão corretos

2. **Verifique os logs**:
   - Erros são logados em `error_log` do PHP
   - Verifique o console do servidor ou arquivo de log

3. **PHPMailer não instalado**:
   ```bash
   composer install
   ```

4. **Firewall/Porta bloqueada**:
   - Certifique-se de que a porta SMTP (587, 465) está aberta
   - Verifique se o servidor permite conexões SMTP

### Erro: "PHPMailer não está instalado"

Execute no diretório do projeto:
```bash
composer install
```

### Erro: "Configurações de e-mail não encontradas"

1. Configure o SMTP em **Configurações > E-mail**
2. Salve as configurações
3. Tente enviar o convite novamente

## 📝 Notas

- O convite é criado no banco mesmo se o e-mail falhar
- Em caso de falha no envio, o sistema retorna um aviso mas não impede a criação do convite
- Os templates de e-mail são HTML responsivos
- O sistema suporta TLS e SSL para criptografia SMTP

## 🚀 Próximos Passos

- [ ] Melhorar criptografia da senha SMTP (openssl_encrypt)
- [ ] Adicionar página para aceitar convite (link no e-mail)
- [ ] Histórico de e-mails enviados
- [ ] Reenvio de convites expirados
- [ ] Templates de e-mail customizáveis por família


