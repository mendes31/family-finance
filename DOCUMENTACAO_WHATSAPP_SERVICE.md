# 📱 Documentação: SendWhatsAppService

## 📋 Visão Geral

O sistema possui uma integração flexível com WhatsApp que suporta **3 provedores diferentes**:
1. **Evolution API** (Open Source - Recomendado)
2. **Twilio** (Pago - Internacional)
3. **Meta/Facebook** (Oficial - Requer aprovação)

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Sistema FinFamily                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   SendWhatsAppService (Helper)        │
        │   - sendMessage()                     │
        │   - sendViaEvolution()                │
        │   - sendViaTwilio()                    │
        │   - sendViaMeta()                      │
        │   - formatPhoneNumber()                │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   get_whatsapp_settings()             │
        │   - Busca configurações do banco      │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Tabela: whatsapp_settings            │
        │   - Armazena configurações             │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   API Externa (Evolution/Twilio/Meta)  │
        └───────────────────────────────────────┘
```

---

## 🔄 Fluxo de Funcionamento

### 1. Configuração Inicial

**Arquivo:** `src/pages/WhatsAppSettings.tsx`

**Processo:**
1. Usuário acessa `/settings/whatsapp`
2. Sistema busca configuração ativa no banco (`whatsapp_settings`)
3. Exibe formulário com campos:
   - **Provedor** (Evolution/Twilio/Meta)
   - **URL da API**
   - **API Key**
   - **API Token** (opcional)
   - **Nome da Instância** (Evolution)
   - **Número WhatsApp** (Twilio)
   - **Webhook URL** (opcional)
   - **Ativar/Desativar**

**Salvamento:**
- Endpoint: `api/whatsapp_settings.php?action=save`
- Tabela: `whatsapp_settings`
- **Lógica:** Se já existe configuração, faz UPDATE. Se não existe, faz INSERT.
- **Segurança:** API Key e Token são criptografados antes de salvar.

---

### 2. Envio de Mensagem

**Arquivo:** `api/helpers/SendWhatsAppService.php`

**Método Principal:** `sendMessage($pdo, $family_id, $phoneNumber, $message, $options = [])`

#### Passo 1: Buscar Configuração
```php
$config = get_whatsapp_settings($pdo, $family_id);

// Verificar se está ativo
if (empty($config) || !$config['is_active']) {
    return ['success' => false, 'error' => 'WhatsApp não configurado ou desativado'];
}
```

#### Passo 2: Formatar Número de Telefone
```php
// Limpar (apenas dígitos)
$phoneNumber = preg_replace('/\D/', '', $phoneNumber);

// Garantir DDI brasileiro (55)
// Se tem 10 ou 11 dígitos → adicionar 55
if (strlen($phoneNumber) === 10 || strlen($phoneNumber) === 11) {
    $phoneNumber = '55' . $phoneNumber;
}

// Resultado: 5541999887766 (DDI + DDD + número)
```

**Lógica:**
- Número local (10-11 dígitos): `41999887766` → `5541999887766`
- Número com DDI incorreto: `41999887766` → `5541999887766`
- Número já completo: `5541999887766` → mantém

#### Passo 3: Escolher Provedor
```php
return match ($config['provider']) {
    'evolution' => self::sendViaEvolution(...),
    'twilio' => self::sendViaTwilio(...),
    'meta' => self::sendViaMeta(...),
    default => ['success' => false, 'error' => 'Provedor desconhecido']
};
```

---

### 3. Envio por Provedor

#### 🔵 Evolution API (Recomendado)

**Método:** `SendWhatsAppService::sendViaEvolution()`

**Características:**
- ✅ Open Source (grátis)
- ✅ Hospedagem própria
- ✅ Sem limites de mensagens
- ✅ Popular no Brasil

**Endpoint:**
```
POST {api_url}/message/sendText/{instance_name}
```

**Headers:**
```
Content-Type: application/json
apikey: {api_key}
```

**Payload:**
```json
{
  "number": "5541999887766",
  "text": "Mensagem aqui"
}
```

**Resposta de Sucesso:**
```json
{
  "key": {
    "id": "message_id_123"
  }
}
```

**Tratamento de SSL:**
- Se `WHATSAPP_IGNORE_SSL=true` no `.env` e URL é HTTPS:
  - Ignora verificação SSL (útil para desenvolvimento com ngrok)

**Logs:**
- URL da requisição
- Payload enviado
- HTTP Code
- Resposta completa

---

#### 🟡 Twilio API

**Método:** `SendWhatsAppService::sendViaTwilio()`

**Características:**
- 💰 Pago (por mensagem)
- ✅ Confiável
- ✅ Internacional
- ✅ Suporte oficial

**Endpoint:**
```
POST https://api.twilio.com/2010-04-01/Accounts/{api_key}/Messages.json
```

**Autenticação:**
```
Basic Auth: {api_key}:{api_token}
```

**Payload (form-urlencoded):**
```
From: whatsapp:+{phone_number}
To: whatsapp:+{phoneNumber}
Body: {message}
```

**Resposta de Sucesso:**
```json
{
  "sid": "message_id_123"
}
```

---

#### 🟢 Meta/Facebook API (Oficial)

**Método:** `SendWhatsAppService::sendViaMeta()`

**Características:**
- ✅ API oficial do WhatsApp
- ⚠️ Requer aprovação do Facebook
- ⚠️ Processo de verificação longo
- ✅ Mais confiável para produção

**Endpoint:**
```
POST {api_url}/messages
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {api_token}
```

**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "5541999887766",
  "type": "text",
  "text": {
    "body": "Mensagem aqui"
  }
}
```

**Resposta de Sucesso:**
```json
{
  "messages": [{
    "id": "message_id_123"
  }]
}
```

---

## 📍 Onde é Usado

### 1. Convite de Membros
**Arquivo:** `api/config.php` → `send_invitation_whatsapp()`

**Fluxo:**
1. Usuário convida novo membro
2. Preenche número WhatsApp (opcional)
3. Sistema gera link de convite
4. Se número fornecido:
   - Formata mensagem com link
   - Chama `SendWhatsAppService::sendMessage()`

**Exemplo de Mensagem:**
```
🎉 *Bem-vindo ao FinFamily!*

Olá, João!

Você foi convidado para fazer parte de uma família no FinFamily.

📧 *Suas credenciais de acesso:*
E-mail: será informado no e-mail
Senha: *abc123*

⚠️ *Importante:* Guarde esta senha com segurança.

✨ Para aceitar o convite e ativar sua conta, acesse:
👉 https://seusite.com.br/accept-invitation?token=xyz

⏰ Este convite expira em 7 dias.
```

---

### 2. Teste de Configuração
**Arquivo:** `api/whatsapp_settings.php` → `handleTestWhatsAppSettings()`

**Fluxo:**
1. Usuário preenche número de teste
2. Sistema envia mensagem de teste
3. Retorna sucesso/erro

**Mensagem de Teste:**
```
✅ *Teste de Configuração WhatsApp*

Esta mensagem foi enviada automaticamente pelo FinFamily.

📅 Data/Hora: 29/01/2026 20:15:00

_Se você recebeu esta mensagem, a integração está funcionando corretamente!_
```

---

## 🔧 Configurações Importantes

### Variáveis de Ambiente

**`.env`:**
```env
# Opcional: Ignorar verificação SSL em desenvolvimento
WHATSAPP_IGNORE_SSL=true  # ou false em produção
```

**Uso:**
- Útil quando usa ngrok ou servidor local com HTTPS
- Em produção, deve ser `false` para segurança

---

### Estrutura do Banco de Dados

**Tabela:** `whatsapp_settings`

**Campos:**
- `id` (PK)
- `family_id` (FK)
- `provider` (enum: evolution, twilio, meta)
- `api_url` (URL da API)
- `api_key` (Chave de autenticação - criptografada)
- `api_token` (Token - criptografado, opcional)
- `instance_name` (Nome da instância - Evolution)
- `whatsapp_number` (Número WhatsApp - Twilio)
- `webhook_url` (URL para receber notificações)
- `is_active` (boolean - ativar/desativar)
- `created_at`, `updated_at`

**Lógica:**
- Apenas **1 configuração ativa** por família (`is_active = 1`)
- API Key e Token são criptografados usando `openssl_encrypt`

---

## 🔄 Fluxo Completo de Envio

```
1. Sistema precisa enviar WhatsApp
   │
   ▼
2. Chama SendWhatsAppService::sendMessage($pdo, $family_id, $phone, $message)
   │
   ▼
3. Busca configuração no banco (get_whatsapp_settings)
   │
   ├─ Se não configurado → Retorna erro
   │
   └─ Se configurado → Continua
   │
   ▼
4. Formata número de telefone (adiciona DDI 55 se necessário)
   │
   ▼
5. Escolhe método baseado no provedor:
   │
   ├─ Evolution → sendViaEvolution()
   │   ├─ Monta URL: {api_url}/message/sendText/{instance_name}
   │   ├─ Headers: apikey
   │   ├─ Payload: {number, text}
   │   └─ Retorna: {success, message_id, provider}
   │
   ├─ Twilio → sendViaTwilio()
   │   ├─ URL: api.twilio.com/Accounts/{api_key}/Messages.json
   │   ├─ Auth: Basic (api_key:api_token)
   │   ├─ Payload: {From, To, Body}
   │   └─ Retorna: {success, message_id, provider}
   │
   └─ Meta → sendViaMeta()
       ├─ URL: {api_url}/messages
       ├─ Headers: Authorization Bearer {api_token}
       ├─ Payload: {messaging_product, to, type, text}
       └─ Retorna: {success, message_id, provider}
   │
   ▼
6. Retorna resultado para quem chamou
   │
   ├─ success: true → Mensagem enviada
   └─ success: false → Erro (mostra mensagem)
```

---

## 🛡️ Tratamento de Erros

### Erros Comuns

1. **"WhatsApp não configurado ou desativado"**
   - Causa: `is_active = 0` ou configuração não existe
   - Solução: Ativar em `/settings/whatsapp`

2. **"HTTP 401" (Unauthorized)**
   - Causa: API Key/Token incorreto
   - Solução: Verificar credenciais

3. **"HTTP 404" (Not Found)**
   - Causa: URL da API incorreta ou instância não existe
   - Solução: Verificar URL e nome da instância

4. **"HTTP 0" (Connection Failed)**
   - Causa: Servidor inacessível ou SSL inválido
   - Solução: Verificar conectividade ou usar `WHATSAPP_IGNORE_SSL=true` (dev)

---

## 📝 Logs e Debug

**Onde são gerados:**
- `error_log()` do PHP
- Logs gerais do sistema

**Informações logadas:**
- URL da requisição
- Payload enviado
- HTTP Code recebido
- Resposta completa da API
- Número formatado
- Erros e exceções

**Exemplo de Log:**
```
SendWhatsAppService: Enviando mensagem para 5541999887766 via evolution (Família: abc123)
SendWhatsAppService [Evolution]: URL: http://192.168.1.222:8085/message/sendText/FinFamily
SendWhatsAppService [Evolution]: Payload: {"number":"5541999887766","text":"Mensagem aqui"}
SendWhatsAppService [Evolution]: HTTP Code: 200
SendWhatsAppService [Evolution]: Response: {"key":{"id":"message_123"}}
SendWhatsAppService: Mensagem enviada com sucesso. Provider: evolution, Message ID: message_123
```

---

## 🎯 Casos de Uso no Sistema

### 1. Convite de Membros
```php
// Em api/config.php
$result = send_invitation_whatsapp($pdo, $family_id, $phone, $full_name, $token, $password, $type);
if ($result['success']) {
    // Mensagem enviada com sucesso
}
```

### 2. Teste de Configuração
```php
// Em api/whatsapp_settings.php
$result = SendWhatsAppService::sendMessage($pdo, $family_id, $testNumber, $message, ['config' => $test_config]);
// Mostra mensagem de sucesso/erro para o usuário
```

---

## 🔐 Segurança

### Validações Implementadas

1. **Validação de Entrada**
   - Números são limpos (apenas dígitos)
   - URLs são validadas
   - Campos obrigatórios verificados

2. **Criptografia**
   - API Key e Token são criptografados no banco
   - Usa `openssl_encrypt` com AES-256-CBC

3. **SSL/TLS**
   - Em produção: SSL verificado
   - Em desenvolvimento: Pode ignorar com flag

4. **Permissões**
   - Página de configuração requer autenticação
   - Apenas membros da família podem configurar

---

## 📊 Estrutura de Retorno

**Sucesso:**
```php
[
    'success' => true,
    'message_id' => 'abc123',
    'provider' => 'evolution'
]
```

**Erro:**
```php
[
    'success' => false,
    'error' => 'HTTP 401: Unauthorized',
    'provider' => 'evolution'
]
```

---

## 🚀 Como Adicionar Novo Provedor

1. **Adicionar opção no formulário** (`WhatsAppSettings.tsx`)
2. **Adicionar método no Service** (`SendWhatsAppService.php`)
   ```php
   private static function sendViaNovoProvedor(...): array
   {
       // Lógica de envio
   }
   ```
3. **Adicionar no match** (`sendMessage()`)
   ```php
   'novo_provedor' => self::sendViaNovoProvedor(...)
   ```

---

## 📚 Resumo

**Arquitetura:**
- Service Pattern (SendWhatsAppService)
- Configuração centralizada no banco
- Suporte a múltiplos provedores

**Fluxo:**
1. Configurar → Salvar no banco (criptografado)
2. Enviar → Buscar config → Formatar número → Escolher provedor → Enviar
3. Retornar → Sucesso ou Erro

**Vantagens:**
- ✅ Flexível (3 provedores)
- ✅ Fácil de trocar provedor
- ✅ Configuração via interface
- ✅ Logs detalhados
- ✅ Tratamento de erros robusto
- ✅ Formatação automática de números
- ✅ Código centralizado e reutilizável

---

## 🔍 Exemplo Prático

**Cenário:** Usuário convida novo membro e fornece número WhatsApp

```php
// 1. Usuário preenche formulário "Convidar Membro"
// 2. Fornece número WhatsApp: "41999887766"
// 3. Sistema processa em api/family.php

$phone = "41999887766";
$message = "🎉 Bem-vindo ao FinFamily!\n\n...";

// 4. Chama o Service
$result = SendWhatsAppService::sendMessage($pdo, $family_id, $phone, $message);

// 5. Service internamente:
//    - Busca config no banco
//    - Formata número: "41999887766" → "5541999887766"
//    - Escolhe Evolution (provedor configurado)
//    - Faz POST para API Evolution
//    - Retorna: ['success' => true, 'message_id' => 'xyz', 'provider' => 'evolution']

// 6. Sistema mostra mensagem de sucesso
```

---

## ✅ Conclusão

A API WhatsApp do sistema é:
- **Modular:** Fácil de manter e estender
- **Flexível:** Suporta múltiplos provedores
- **Robusta:** Tratamento de erros e logs
- **Segura:** Validações e criptografia
- **Pronta para produção:** Testada e documentada

