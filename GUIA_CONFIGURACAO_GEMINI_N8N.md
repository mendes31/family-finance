# 🚀 Guia Completo: Configurar Gemini no n8n

## 📋 Passo a Passo Completo

---

## 📝 Pré-requisitos

- ✅ Conta Google (Gmail)
- ✅ VPS Hostinger configurado
- ✅ n8n instalado no VPS
- ✅ Evolution API configurado (WhatsApp)

---

## 🔧 PASSO 1: Criar Conta Google Cloud

### 1.1 Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Aceite os termos (se for primeira vez)

### 1.2 Criar Novo Projeto

1. No topo da página, clique no **seletor de projetos** (ao lado do logo Google Cloud)
2. Clique em **"Novo Projeto"**
3. Preencha:
   - **Nome do projeto:** `family-finance-whatsapp` (ou qualquer nome)
   - **Organização:** (deixe padrão)
4. Clique em **"Criar"**
5. Aguarde alguns segundos
6. Selecione o projeto criado no seletor

---

## 🔑 PASSO 2: Ativar API do Gemini

### 2.1 Ativar Generative Language API

1. No menu lateral, vá em **"APIs e serviços"** > **"Biblioteca"**
2. Na barra de busca, digite: **"Generative Language API"**
3. Clique no resultado: **"Generative Language API"**
4. Clique no botão **"ATIVAR"**
5. Aguarde alguns segundos (pode demorar 1-2 minutos)

### 2.2 Verificar Ativação

1. Vá em **"APIs e serviços"** > **"APIs habilitadas"**
2. Você deve ver **"Generative Language API"** na lista
3. Status deve estar como **"Habilitada"**

---

## 🔐 PASSO 3: Gerar API Key

### 3.1 Criar Credencial

1. No menu lateral, vá em **"APIs e serviços"** > **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"** (no topo)
3. Selecione **"Chave de API"**
4. Aguarde alguns segundos
5. Uma janela popup aparecerá com sua **API Key**
6. **COPIE A CHAVE** imediatamente (ela só aparece uma vez!)
   - Exemplo: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

### 3.2 Salvar API Key com Segurança

**⚠️ IMPORTANTE:** Guarde esta chave em local seguro!

1. Crie um arquivo `.env` no seu servidor:
   ```bash
   nano /root/.env
   ```

2. Adicione:
   ```env
   GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
   ```

3. Salve e feche (Ctrl+X, Y, Enter)

### 3.3 (Opcional) Restringir API Key

Para segurança, você pode restringir a chave:

1. Na página de Credenciais, clique na chave criada
2. Em **"Restrições de aplicativo"**, selecione **"Endereços IP"**
3. Adicione o IP do seu VPS
4. Em **"Restrições de API"**, selecione **"Limitar chave"**
5. Selecione apenas **"Generative Language API"**
6. Clique em **"Salvar"**

---

## 🛠️ PASSO 4: Instalar n8n (se ainda não tiver)

### 4.1 Instalar Node.js

```bash
# Conectar ao VPS via SSH
ssh root@seu-ip-vps

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v18.x.x
npm --version
```

### 4.2 Instalar n8n

```bash
# Instalar n8n globalmente
npm install -g n8n

# Ou usar npx (sem instalar globalmente)
npx n8n
```

### 4.3 Configurar n8n como Serviço (Opcional mas Recomendado)

```bash
# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Iniciar n8n com PM2
pm2 start n8n --name "n8n"

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### 4.4 Acessar n8n

1. Abra navegador: `http://seu-ip-vps:5678`
2. Crie sua conta (primeira vez)
3. Faça login

---

## 🔌 PASSO 5: Configurar Gemini no n8n

### 5.1 Criar Novo Workflow

1. No n8n, clique em **"Workflows"** > **"New"**
2. Dê um nome: `WhatsApp - Processar Perguntas`

### 5.2 Adicionar Node: Webhook (Receber Mensagens)

1. Arraste o node **"Webhook"** para o canvas
2. Configure:
   - **HTTP Method:** POST
   - **Path:** `whatsapp-message`
   - **Response Mode:** Respond When Last Node Finishes
3. Clique em **"Listen for Test Event"**
4. **COPIE A URL** que aparece (ex: `http://seu-ip:5678/webhook/whatsapp-message`)
5. Esta URL será usada no Evolution API

### 5.3 Adicionar Node: Code (Extrair Dados com Gemini)

1. Arraste o node **"Code"** para o canvas
2. Conecte após o Webhook
3. Configure o código:

```javascript
// Configurações
const GEMINI_API_KEY = 'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567'; // SUA CHAVE AQUI
const message = $input.item.json.message || $input.item.json.text;

// Prompt para extrair dados
const prompt = `
Extraia os dados desta pergunta financeira em português:
"${message}"

Retorne APENAS um JSON válido com:
{
  "type": "expense" ou "income" ou "investment",
  "category": "nome da categoria (ex: Combustível, Alimentação, Supermercado)",
  "period": "este mês" ou "mês passado" ou "últimos X meses" ou data específica,
  "startDate": "2025-01-01" (formato YYYY-MM-DD),
  "endDate": "2025-01-31" (formato YYYY-MM-DD),
  "questionType": "total" ou "lista" ou "resumo"
}

Se não conseguir identificar algum campo, use null.
`;

// Chamar Gemini API
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  }
);

// Processar resposta
const data = await response.json();

if (!data.candidates || !data.candidates[0]) {
  throw new Error('Erro ao processar resposta do Gemini: ' + JSON.stringify(data));
}

const extractedText = data.candidates[0].content.parts[0].text;

// Extrair JSON da resposta (pode vir com markdown ```json)
let jsonText = extractedText;
if (jsonText.includes('```json')) {
  jsonText = jsonText.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || jsonText;
} else if (jsonText.includes('```')) {
  jsonText = jsonText.match(/```\s*([\s\S]*?)\s*```/)?.[1] || jsonText;
}

// Extrair JSON (pode estar dentro de texto)
const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('Não foi possível extrair JSON da resposta: ' + extractedText);
}

const extractedData = JSON.parse(jsonMatch[0]);

// Retornar dados
return {
  json: {
    ...extractedData,
    originalMessage: message,
    phoneNumber: $input.item.json.from || $input.item.json.phone
  }
};
```

4. Clique em **"Execute Node"** para testar
5. Se der erro, verifique a API Key

### 5.4 Adicionar Node: HTTP Request (Buscar Categoria)

1. Arraste o node **"HTTP Request"** para o canvas
2. Conecte após o Code node
3. Configure:
   - **Method:** GET
   - **URL:** `http://localhost/family_finance/api/categories.php?type={{$json.type}}`
   - **Authentication:** None (ou configure se tiver)
4. Adicione node **"Code"** após para filtrar categoria:

```javascript
const categories = $input.item.json;
const categoryName = $('Code').item.json.category;

// Buscar categoria que corresponde ao nome
const foundCategory = categories.find(cat => 
  cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
  categoryName.toLowerCase().includes(cat.name.toLowerCase())
);

if (!foundCategory) {
  // Se não encontrar, retornar null (usuário pode escolher depois)
  return {
    json: {
      categoryId: null,
      categoryName: categoryName,
      message: `Categoria "${categoryName}" não encontrada. Categorias disponíveis: ${categories.map(c => c.name).join(', ')}`
    }
  };
}

return {
  json: {
    categoryId: foundCategory.id,
    categoryName: foundCategory.name,
    ...$('Code').item.json
  }
};
```

### 5.5 Adicionar Node: HTTP Request (Buscar Transações)

1. Arraste o node **"HTTP Request"** para o canvas
2. Conecte após o Code anterior
3. Configure:
   - **Method:** GET
   - **URL:** `http://localhost/family_finance/api/transactions.php?action=list&type={{$json.type}}&categoryId={{$json.categoryId}}&startDate={{$json.startDate}}&endDate={{$json.endDate}}`
   - **Authentication:** None (ou configure sessão)

### 5.6 Adicionar Node: Code (Calcular Total)

```javascript
const transactions = $input.item.json.transactions || [];
const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
const count = transactions.length;

return {
  json: {
    total: total,
    count: count,
    transactions: transactions,
    ...$('Code').item.json
  }
};
```

### 5.7 Adicionar Node: Code (Formatar Resposta com Gemini)

```javascript
const GEMINI_API_KEY = 'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567'; // SUA CHAVE AQUI
const question = $('Code').item.json.originalMessage;
const total = $input.item.json.total;
const count = $input.item.json.count;
const categoryName = $input.item.json.categoryName;

const prompt = `
Formate esta resposta de forma natural, amigável e em português:

Pergunta: "${question}"
Resposta: Total de R$ ${total.toFixed(2)} em ${count} transação(ões) na categoria "${categoryName}"

Formate de forma conversacional, como se estivesse conversando com um amigo.
Use emojis se apropriado (💰 para dinheiro, 📊 para estatísticas, etc).
Seja breve e direto.
`;

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  }
);

const data = await response.json();
const formattedAnswer = data.candidates[0].content.parts[0].text;

return {
  json: {
    answer: formattedAnswer,
    phoneNumber: $('Code').item.json.phoneNumber
  }
};
```

### 5.8 Adicionar Node: HTTP Request (Enviar Resposta no WhatsApp)

1. Arraste o node **"HTTP Request"** para o canvas
2. Conecte após o Code de formatação
3. Configure:
   - **Method:** POST
   - **URL:** `http://localhost:8080/message/sendText` (URL do Evolution API)
   - **Body (JSON):**
   ```json
   {
     "number": "{{$json.phoneNumber}}",
     "text": "{{$json.answer}}"
   }
   ```

---

## 🔗 PASSO 6: Conectar Evolution API ao n8n

### 6.1 Configurar Webhook no Evolution API

1. Acesse o painel do Evolution API (geralmente: `http://seu-ip:8080`)
2. Vá em **"Webhooks"** ou **"Configurações"**
3. Adicione webhook:
   - **URL:** `http://seu-ip-n8n:5678/webhook/whatsapp-message`
   - **Eventos:** `messages.upsert` (quando recebe mensagem)
4. Salve

### 6.2 Testar Fluxo

1. Envie uma mensagem no WhatsApp para o número conectado
2. Verifique no n8n se o webhook foi acionado
3. Veja os logs de cada node
4. Verifique se a resposta foi enviada

---

## 🧪 PASSO 7: Testar

### 7.1 Teste Manual

1. No n8n, clique em **"Execute Workflow"**
2. No primeiro node (Webhook), clique em **"Listen for Test Event"**
3. Envie uma mensagem de teste no WhatsApp
4. Veja o fluxo executar passo a passo

### 7.2 Testar Perguntas

Envie estas perguntas no WhatsApp:

- ✅ "Quanto gastei esse mês com gasolina?"
- ✅ "Qual meu gasto com supermercado em janeiro?"
- ✅ "Quanto foi de receita no mês passado?"
- ✅ "Mostre minhas despesas com alimentação"

### 7.3 Verificar Logs

1. No n8n, veja o histórico de execuções
2. Clique em cada execução para ver detalhes
3. Verifique se há erros
4. Ajuste conforme necessário

---

## 🐛 Troubleshooting

### Erro: "API Key inválida"
- ✅ Verifique se copiou a chave corretamente
- ✅ Verifique se a API está ativada
- ✅ Verifique se não há espaços na chave

### Erro: "Rate limit exceeded"
- ✅ Você está fazendo mais de 15 requisições/minuto
- ✅ Implemente fila (Redis) ou aguarde

### Erro: "Categoria não encontrada"
- ✅ Verifique se as categorias existem no banco
- ✅ Ajuste o prompt do Gemini para ser mais específico
- ✅ Adicione mapeamento manual de sinônimos

### Erro: "Webhook não recebe mensagens"
- ✅ Verifique se o Evolution API está configurado
- ✅ Verifique se a URL do webhook está correta
- ✅ Verifique firewall (porta 5678 deve estar aberta)

---

## 📊 Estrutura Final do Workflow

```
Webhook (recebe mensagem)
  ↓
Code (Extrair dados com Gemini)
  ↓
HTTP Request (Buscar categorias)
  ↓
Code (Filtrar categoria)
  ↓
HTTP Request (Buscar transações)
  ↓
Code (Calcular total)
  ↓
Code (Formatar resposta com Gemini)
  ↓
HTTP Request (Enviar no WhatsApp)
```

---

## 🔒 Segurança

### 1. Não Expor API Key

**❌ NÃO faça:**
- Colocar API Key diretamente no código
- Commitar API Key no Git
- Compartilhar API Key publicamente

**✅ FAÇA:**
- Usar variáveis de ambiente
- Usar secrets do n8n
- Restringir API Key no Google Cloud

### 2. Usar Secrets no n8n

1. No n8n, vá em **"Settings"** > **"Credentials"**
2. Clique em **"Add Credential"**
3. Escolha **"Generic Credential Type"**
4. Nome: `GEMINI_API_KEY`
5. Adicione sua chave
6. No código, use: `$env.GEMINI_API_KEY`

---

## 📝 Variáveis de Ambiente (Recomendado)

### No n8n:

1. Vá em **"Settings"** > **"Environment Variables"**
2. Adicione:
   - `GEMINI_API_KEY=AIzaSy...`
   - `API_BASE_URL=http://localhost/family_finance/api`
   - `EVOLUTION_API_URL=http://localhost:8080`

### No código, use:

```javascript
const GEMINI_API_KEY = $env.GEMINI_API_KEY;
const API_BASE_URL = $env.API_BASE_URL;
```

---

## ✅ Checklist Final

- [ ] Conta Google Cloud criada
- [ ] Projeto criado
- [ ] Generative Language API ativada
- [ ] API Key gerada e salva
- [ ] n8n instalado e rodando
- [ ] Workflow criado no n8n
- [ ] Todos os nodes configurados
- [ ] Evolution API conectado ao webhook
- [ ] Teste manual funcionando
- [ ] Perguntas sendo processadas corretamente
- [ ] Respostas sendo enviadas no WhatsApp

---

## 🎉 Pronto!

Agora você tem:
- ✅ Gemini gratuito configurado
- ✅ n8n processando perguntas
- ✅ Integração com sua API PHP
- ✅ Respostas automáticas no WhatsApp
- ✅ **Custo: R$ 38,99/mês** (apenas VPS)

---

**Última atualização:** Janeiro 2025

