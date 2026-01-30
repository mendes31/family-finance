# Troubleshooting: E-mail não está sendo enviado

## ✅ Melhorias Implementadas

### 1. Feedback Melhorado no Frontend
- Agora mostra mensagem específica se o e-mail não foi enviado
- Exibe o erro detalhado do SMTP
- Toast com duração maior para erros

### 2. Logs Melhorados no Backend
- Logs detalhados de tentativas de envio
- Stack trace em caso de erro
- Logs de configurações SMTP não encontradas

## 🔍 Como Diagnosticar

### 1. Verificar Logs do PHP

Os logs estão em:
- **Windows (WAMP)**: `C:\wamp64\logs\php_error.log` ou `C:\wamp64\logs\apache_error.log`
- **Linux**: `/var/log/apache2/error.log` ou `/var/log/php/error.log`

Procure por:
```
E-mail de convite enviado com sucesso para: [email]
Erro ao enviar e-mail de convite para [email]: [mensagem]
Tentando enviar e-mail de convite para: [email]
```

### 2. Verificar Configurações SMTP

1. Acesse **Configurações > E-mail**
2. Verifique se todas as configurações estão preenchidas:
   - Servidor SMTP
   - Porta
   - Usuário
   - Senha
   - E-mail remetente
   - Nome remetente

3. Clique em **"Testar"** para verificar se as configurações estão corretas

### 3. Problemas Comuns

#### Problema: "Configurações de e-mail não encontradas"
**Solução**: 
1. Configure o SMTP em **Configurações > E-mail**
2. Salve as configurações
3. Tente enviar o convite novamente

#### Problema: "Erro ao enviar e-mail: [mensagem do PHPMailer]"
**Possíveis causas**:

1. **Credenciais SMTP incorretas**
   - Verifique usuário e senha
   - Para Gmail, use senha de app (não a senha da conta)

2. **Porta bloqueada pelo firewall**
   - Porta 587 (TLS) ou 465 (SSL)
   - Verifique se o firewall permite conexões SMTP

3. **Servidor SMTP incorreto**
   - Gmail: `smtp.gmail.com`
   - Outlook: `smtp-mail.outlook.com`
   - Yahoo: `smtp.mail.yahoo.com`

4. **Criptografia incorreta**
   - Porta 587 = TLS
   - Porta 465 = SSL

5. **E-mail indo para spam**
   - Verifique a pasta de spam
   - Adicione o remetente aos contatos

### 4. Testar Configuração SMTP

1. Acesse **Configurações > E-mail**
2. Preencha todas as configurações
3. Clique em **"Testar"**
4. Verifique se recebeu o e-mail de teste

Se o teste funcionar mas o convite não:
- Verifique os logs do PHP
- Verifique se o e-mail não foi para spam
- Verifique se o e-mail do destinatário está correto

### 5. Verificar no Console do Navegador

Abra o DevTools (F12) e verifique:
- Se há erros na aba Console
- Se a resposta da API contém `email_sent: false`
- Se há mensagem de erro em `email_error`

### 6. Verificar no Backend

No arquivo `api/family.php`, linha ~301, o código tenta enviar o e-mail e loga o resultado:

```php
$email_result = send_invitation_email(...);
if ($email_result['success']) {
    error_log("E-mail de convite enviado com sucesso para: $email");
} else {
    error_log("Erro ao enviar e-mail de convite para $email: " . $email_result['message']);
}
```

Verifique os logs do PHP para ver a mensagem de erro exata.

## 🚀 Próximos Passos

1. **Verifique os logs do PHP** para ver o erro exato
2. **Teste as configurações SMTP** em Configurações > E-mail
3. **Verifique a pasta de spam** do destinatário
4. **Confirme que o PHPMailer está instalado**: `composer install`

## 📝 Notas

- O convite é criado mesmo se o e-mail falhar
- O sistema mostra uma mensagem de aviso se o e-mail não foi enviado
- Verifique sempre a pasta de spam primeiro
- Para Gmail, é necessário usar senha de app (não a senha normal)


