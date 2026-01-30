# 🤖 Guia de Automações WhatsApp - Family Finance Hub

## 📋 Funcionalidades Desejadas

1. **Enviar imagens de notas/cupons via WhatsApp** → Extrair dados automaticamente → Criar transação
2. **Enviar áudio/mensagens via WhatsApp** → Processar → Criar transação
3. **Fazer perguntas via WhatsApp** → Consultar banco → Responder automaticamente

---

## 🏗️ Arquitetura Necessária

```
WhatsApp → Webhook → Servidor → Processamento → Banco de Dados
                ↓
         [OCR/STT/NLP]
```

---

## 🛠️ O Que Contratar na Hospedagem

### 1. **Hospedagem Principal (Backend PHP)**

**Recomendação:** **VPS ou Cloud Server** (NÃO hospedagem compartilhada)

**Por quê?**
- ✅ Processamento de imagens (OCR) requer CPU/RAM
- ✅ Speech-to-text requer recursos computacionais
- ✅ Webhooks precisam de acesso SSH/terminal
- ✅ Instalação de bibliotecas Python/Node.js
- ✅ Processamento assíncrono (filas)

**Opções Recomendadas:**

#### 🥇 **DigitalOcean Droplet** (Recomendado)
- **Plano:** 4GB RAM / 2 vCPU (R$ 40-60/mês)
- **Por quê:**
  - ✅ Recursos suficientes para OCR/STT
  - ✅ SSD rápido
  - ✅ Escalável
  - ✅ Documentação excelente
  - ✅ Backups automáticos

#### 🥈 **AWS EC2 t3.medium**
- **Plano:** 4GB RAM / 2 vCPU (R$ 50-80/mês)
- **Por quê:**
  - ✅ Integração com outros serviços AWS
  - ✅ Escalável
  - ✅ Confiável

#### 🥉 **Hetzner Cloud**
- **Plano:** CX21 (4GB RAM / 2 vCPU) - €4-6/mês (~R$ 20-30)
- **Por quê:**
  - ✅ Excelente custo-benefício
  - ✅ Servidores na Europa (latência pode ser maior)

**⚠️ NÃO use hospedagem compartilhada** (Hostinger, HostGator, etc.) para automações WhatsApp, pois:
- ❌ Não permite instalar Python/Node.js
- ❌ Limitações de CPU/RAM
- ❌ Sem acesso SSH completo
- ❌ Não suporta processamento assíncrono

---

### 2. **API do WhatsApp**

#### 🥇 **Evolution API** (Recomendado - Open Source)
- **Custo:** Gratuito (self-hosted)
- **Por quê:**
  - ✅ Open source
  - ✅ Não precisa aprovação do Meta
  - ✅ Funciona com WhatsApp pessoal
  - ✅ Webhooks nativos
  - ✅ Suporte a múltiplas instâncias
- **Requisitos:** Servidor próprio (VPS)
- **Link:** https://evolution-api.com

#### 🥈 **Twilio WhatsApp API**
- **Custo:** ~R$ 0,10-0,50 por mensagem
- **Por quê:**
  - ✅ API oficial e confiável
  - ✅ Documentação excelente
  - ✅ Suporte profissional
  - ✅ Escalável
- **Requisitos:** Aprovação do Twilio
- **Link:** https://www.twilio.com/whatsapp

#### 🥉 **WhatsApp Business API (Meta)**
- **Custo:** Primeiras 1.000 conversas/mês grátis, depois ~R$ 0,05-0,20 por conversa
- **Por quê:**
  - ✅ Oficial do Meta
  - ✅ Mais confiável
  - ✅ Suporte completo
- **Requisitos:** Aprovação do Meta (processo demorado)
- **Link:** https://developers.facebook.com/docs/whatsapp

#### 🏅 **Baileys (Biblioteca Node.js)**
- **Custo:** Gratuito
- **Por quê:**
  - ✅ Biblioteca JavaScript
  - ✅ Funciona com WhatsApp pessoal
  - ✅ Totalmente customizável
- **Requisitos:** Servidor Node.js
- **Link:** https://github.com/WhiskeySockets/Baileys

**Recomendação:** Começar com **Evolution API** (gratuito e flexível)

---

### 3. **OCR (Reconhecimento de Texto em Imagens)**

#### 🥇 **Google Cloud Vision API** (Recomendado)
- **Custo:** Primeiros 1.000 requests/mês grátis, depois ~R$ 0,15 por imagem
- **Por quê:**
  - ✅ Melhor precisão (especialmente para português)
  - ✅ Extrai dados estruturados (valores, datas, CNPJ)
  - ✅ Suporta PDF
  - ✅ API simples
- **Link:** https://cloud.google.com/vision

#### 🥈 **Tesseract OCR (Open Source)**
- **Custo:** Gratuito
- **Por quê:**
  - ✅ Open source
  - ✅ Pode rodar no próprio servidor
  - ✅ Sem limites de uso
- **Requisitos:** Instalação no servidor (Python/Node.js)
- **Link:** https://github.com/tesseract-ocr/tesseract

#### 🥉 **AWS Textract**
- **Custo:** Primeiros 1.000 páginas/mês grátis, depois ~R$ 0,15 por página
- **Por quê:**
  - ✅ Integração com AWS
  - ✅ Boa precisão
- **Link:** https://aws.amazon.com/textract/

**Recomendação:** Começar com **Google Vision API** (melhor precisão)

---

### 4. **Speech-to-Text (Áudio → Texto)**

#### 🥇 **Google Cloud Speech-to-Text** (Recomendado)
- **Custo:** Primeiros 60 minutos/mês grátis, depois ~R$ 0,10-0,20 por minuto
- **Por quê:**
  - ✅ Melhor precisão para português
  - ✅ Suporta áudio do WhatsApp
  - ✅ API simples
- **Link:** https://cloud.google.com/speech-to-text

#### 🥈 **Whisper (OpenAI - Open Source)**
- **Custo:** Gratuito (self-hosted)
- **Por quê:**
  - ✅ Open source
  - ✅ Excelente precisão
  - ✅ Suporta português
- **Requisitos:** Servidor com GPU (recomendado) ou CPU potente
- **Link:** https://github.com/openai/whisper

#### 🥉 **AWS Transcribe**
- **Custo:** Primeiros 60 minutos/mês grátis, depois ~R$ 0,10-0,20 por minuto
- **Por quê:**
  - ✅ Integração com AWS
  - ✅ Boa precisão
- **Link:** https://aws.amazon.com/transcribe/

**Recomendação:** Começar com **Google Speech-to-Text** (melhor para português)

---

### 5. **NLP (Processamento de Linguagem Natural)**

#### 🥇 **OpenAI GPT-4 ou GPT-3.5-turbo** (Recomendado)
- **Custo:** ~R$ 0,01-0,05 por mensagem
- **Por quê:**
  - ✅ Melhor compreensão de contexto
  - ✅ Entende português natural
  - ✅ Pode extrair informações de texto livre
  - ✅ Pode gerar respostas naturais
- **Link:** https://platform.openai.com

#### 🥈 **Google Cloud Natural Language API**
- **Custo:** Primeiros 5.000 requests/mês grátis, depois ~R$ 0,01 por request
- **Por quê:**
  - ✅ Boa para extração de entidades
  - ✅ Suporta português
- **Link:** https://cloud.google.com/natural-language

#### 🥉 **Watson Assistant (IBM)**
- **Custo:** Plano Lite gratuito (até 10.000 mensagens/mês)
- **Por quê:**
  - ✅ Gratuito para começar
  - ✅ Suporta português
- **Link:** https://www.ibm.com/cloud/watson-assistant

**Recomendação:** Usar **GPT-3.5-turbo** (melhor custo-benefício)

---

### 6. **Fila de Processamento (Opcional mas Recomendado)**

Para processar mensagens de forma assíncrona:

#### 🥇 **Redis** (Recomendado)
- **Custo:** Gratuito (self-hosted) ou Redis Cloud (~R$ 10-30/mês)
- **Por quê:**
  - ✅ Fila de mensagens
  - ✅ Cache de respostas
  - ✅ Rápido
- **Link:** https://redis.io

#### 🥈 **RabbitMQ**
- **Custo:** Gratuito (self-hosted)
- **Por quê:**
  - ✅ Fila robusta
  - ✅ Confiável
- **Link:** https://www.rabbitmq.com

**Recomendação:** **Redis** (mais simples e rápido)

---

## 💰 Estimativa de Custos Mensais

### Opção 1: Mínima (Começar)
- **VPS (DigitalOcean):** R$ 40-60/mês
- **Evolution API:** Gratuito
- **Google Vision API:** R$ 0-20/mês (primeiros 1.000 grátis)
- **Google Speech-to-Text:** R$ 0-30/mês (primeiros 60 min grátis)
- **OpenAI GPT-3.5:** R$ 10-50/mês
- **Total:** ~R$ 50-160/mês

### Opção 2: Intermediária
- **VPS (DigitalOcean):** R$ 60-80/mês
- **Twilio WhatsApp:** R$ 20-50/mês (200-500 mensagens)
- **Google Vision API:** R$ 30-50/mês
- **Google Speech-to-Text:** R$ 40-80/mês
- **OpenAI GPT-4:** R$ 50-100/mês
- **Redis Cloud:** R$ 20/mês
- **Total:** ~R$ 220-380/mês

### Opção 3: Avançada
- **VPS (AWS EC2):** R$ 80-120/mês
- **WhatsApp Business API:** R$ 50-100/mês
- **Google Vision API:** R$ 50-100/mês
- **Google Speech-to-Text:** R$ 80-150/mês
- **OpenAI GPT-4:** R$ 100-200/mês
- **Redis Cloud:** R$ 30/mês
- **Total:** ~R$ 440-700/mês

---

## 🏗️ Estrutura de Implementação

### 1. **Servidor Principal (VPS)**

```
servidor/
├── api/                    # API PHP existente
├── whatsapp-bot/          # Bot WhatsApp (Node.js/Python)
│   ├── webhook.js         # Recebe mensagens do WhatsApp
│   ├── message-handler.js # Processa mensagens
│   ├── ocr-service.js     # Integração com OCR
│   ├── stt-service.js     # Integração com Speech-to-Text
│   ├── nlp-service.js     # Integração com GPT
│   └── transaction-creator.js # Cria transações na API
├── queue/                 # Fila de processamento (Redis)
└── uploads/               # Imagens temporárias
```

### 2. **Fluxo de Processamento**

#### **Cenário 1: Imagem de Nota Fiscal**
```
WhatsApp → Webhook → Salvar imagem → OCR (Google Vision) 
→ Extrair: valor, data, estabelecimento, CNPJ
→ NLP (GPT) para categorizar
→ Criar transação via API PHP
→ Responder no WhatsApp: "✅ Lançamento criado: R$ 50,00 - Supermercado"
```

#### **Cenário 2: Áudio/Mensagem de Texto**
```
WhatsApp → Webhook → STT (se áudio) ou texto direto
→ NLP (GPT) para extrair: tipo, valor, descrição, categoria
→ Criar transação via API PHP
→ Responder no WhatsApp: "✅ Despesa registrada: R$ 30,00 - Uber"
```

#### **Cenário 3: Pergunta**
```
WhatsApp → Webhook → NLP (GPT) para entender pergunta
→ Consultar banco via API PHP
→ GPT formata resposta natural
→ Responder no WhatsApp: "💰 Você gastou R$ 250,00 com combustível este mês"
```

---

## 📝 Checklist de Implementação

### Fase 1: Infraestrutura
- [ ] Contratar VPS (DigitalOcean/AWS)
- [ ] Configurar servidor (PHP, Node.js, Python)
- [ ] Instalar Evolution API ou configurar Twilio
- [ ] Configurar webhook do WhatsApp
- [ ] Configurar SSL/HTTPS

### Fase 2: Serviços Externos
- [ ] Criar conta Google Cloud (Vision + Speech-to-Text)
- [ ] Criar conta OpenAI (GPT API)
- [ ] Configurar Redis (opcional)

### Fase 3: Desenvolvimento
- [ ] Criar endpoint de webhook
- [ ] Implementar processamento de imagens (OCR)
- [ ] Implementar processamento de áudio (STT)
- [ ] Implementar NLP para extrair dados
- [ ] Implementar criação de transações
- [ ] Implementar consultas ao banco
- [ ] Implementar respostas automáticas

### Fase 4: Testes
- [ ] Testar envio de imagem
- [ ] Testar envio de áudio
- [ ] Testar perguntas
- [ ] Testar tratamento de erros

---

## 🔧 Exemplo de Código (Node.js)

### Webhook do WhatsApp

```javascript
// whatsapp-bot/webhook.js
const express = require('express');
const router = express.Router();
const { processMessage } = require('./message-handler');

router.post('/webhook/whatsapp', async (req, res) => {
  const { message, from } = req.body;
  
  // Verificar se usuário está cadastrado
  const user = await getUserByWhatsApp(from);
  if (!user) {
    return res.json({ 
      message: 'Usuário não cadastrado. Acesse o sistema para se cadastrar.' 
    });
  }
  
  // Processar mensagem (imagem, áudio ou texto)
  const result = await processMessage(message, user);
  
  // Enviar resposta
  await sendWhatsAppMessage(from, result.response);
  
  res.json({ success: true });
});
```

### Processamento de Imagem

```javascript
// whatsapp-bot/ocr-service.js
const vision = require('@google-cloud/vision');

async function extractDataFromImage(imageUrl) {
  const client = new vision.ImageAnnotatorClient();
  
  const [result] = await client.textDetection(imageUrl);
  const detections = result.textAnnotations;
  
  // Extrair texto completo
  const fullText = detections[0]?.description || '';
  
  // Usar GPT para extrair dados estruturados
  const extractedData = await extractWithGPT(fullText);
  
  return {
    value: extractedData.value,
    date: extractedData.date,
    merchant: extractedData.merchant,
    category: extractedData.category
  };
}
```

### Processamento de Áudio

```javascript
// whatsapp-bot/stt-service.js
const speech = require('@google-cloud/speech');

async function transcribeAudio(audioUrl) {
  const client = new speech.SpeechClient();
  
  const config = {
    encoding: 'OGG_OPUS', // Formato do WhatsApp
    sampleRateHertz: 16000,
    languageCode: 'pt-BR',
  };
  
  const audio = { uri: audioUrl };
  const [response] = await client.recognize({ config, audio });
  
  return response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
}
```

### NLP com GPT

```javascript
// whatsapp-bot/nlp-service.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractTransactionData(text) {
  const prompt = `
    Extraia os dados financeiros da seguinte mensagem em português:
    "${text}"
    
    Retorne um JSON com:
    - type: "income" ou "expense"
    - amount: valor numérico
    - description: descrição
    - category: categoria sugerida
    - date: data (se mencionada)
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}

async function answerQuestion(question, userData) {
  // Consultar banco via API PHP
  const data = await queryDatabase(question, userData);
  
  // Formatar resposta com GPT
  const prompt = `
    Responda de forma natural e amigável em português:
    Pergunta: "${question}"
    Dados: ${JSON.stringify(data)}
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return response.choices[0].message.content;
}
```

---

## 🚀 Recomendação Final

### Para Começar (MVP):
1. **VPS DigitalOcean** (4GB RAM) - R$ 40-60/mês
2. **Evolution API** (gratuito) - WhatsApp
3. **Google Vision API** (gratuito até 1.000/mês) - OCR
4. **Google Speech-to-Text** (gratuito até 60 min/mês) - STT
5. **OpenAI GPT-3.5-turbo** (~R$ 10-30/mês) - NLP

**Total:** ~R$ 50-90/mês

### Para Produção:
1. **VPS DigitalOcean** (8GB RAM) - R$ 80-100/mês
2. **Twilio WhatsApp** (~R$ 30-50/mês) - Mais confiável
3. **Google Vision API** (~R$ 30-50/mês)
4. **Google Speech-to-Text** (~R$ 50-100/mês)
5. **OpenAI GPT-4** (~R$ 50-100/mês)
6. **Redis Cloud** (~R$ 20/mês)

**Total:** ~R$ 260-420/mês

---

## 📚 Recursos Úteis

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Google Vision API](https://cloud.google.com/vision/docs)
- [Google Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)

---

**Última atualização:** Janeiro 2025

