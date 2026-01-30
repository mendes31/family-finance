# 💰 Cenários Simples WhatsApp - O Que Realmente Precisa?

## 📋 Cenários Analisados

### 1. **Apenas Anexar Imagens** (sem OCR)
### 2. **Menu de Opções** (bot interativo)

---

## 🎯 Cenário 1: Anexar Imagens (Sem OCR)

### O Que Você Precisa:

#### ✅ **Gratuito:**
- **Evolution API** (gratuito) - Recebe imagens do WhatsApp
- **n8n** (gratuito) - Processa webhooks e salva imagens
- **Seu servidor VPS** - Armazena imagens

#### ❌ **NÃO Precisa:**
- ❌ Google Vision API (OCR) - **NÃO necessário**
- ❌ OpenAI GPT - **NÃO necessário**
- ❌ Google Speech-to-Text - **NÃO necessário**

### Como Funciona:

```
WhatsApp → Evolution API → n8n → Salva imagem → Cria transação com anexo
```

**Fluxo:**
1. Usuário envia imagem no WhatsApp
2. Evolution API recebe e envia webhook para n8n
3. n8n baixa a imagem
4. n8n salva no servidor (pasta uploads/)
5. n8n chama sua API PHP para criar transação
6. Transação é criada com `attachment_url` apontando para a imagem

### Custo: **R$ 0,00** (apenas o VPS)

---

## 🎯 Cenário 2: Menu de Opções (Bot Interativo)

### O Que Você Precisa:

#### ✅ **Gratuito:**
- **Evolution API** (gratuito) - Suporta botões/listas do WhatsApp
- **n8n** (gratuito) - Processa respostas e lógica
- **Seu servidor VPS** - Roda n8n

#### ❌ **NÃO Precisa:**
- ❌ OpenAI GPT - **NÃO necessário** (menu é estruturado)
- ❌ Google Speech-to-Text - **NÃO necessário** (botões não são áudio)
- ❌ Google Vision API - **NÃO necessário**

### Como Funciona:

```
WhatsApp → Evolution API → n8n → Processa escolha → Executa ação
```

**Fluxo Exemplo:**

1. **Usuário envia:** "Olá" ou "/menu"
2. **n8n responde com lista de opções:**
   ```
   O que deseja fazer?
   
   1️⃣ - Novo lançamento
   2️⃣ - Consultar gastos
   3️⃣ - Consultar receitas
   4️⃣ - Ver resumo do mês
   ```
3. **Usuário escolhe:** "1" ou clica no botão
4. **n8n processa escolha:**
   - Se escolheu "1" → Inicia fluxo de novo lançamento
   - Se escolheu "2" → Inicia fluxo de consulta
   - etc.

### Estrutura no n8n:

```
Webhook (recebe mensagem)
  ↓
IF: mensagem = "olá" ou "/menu"
  ↓ SIM
Enviar lista de opções (botões WhatsApp)
  ↓
Aguardar resposta
  ↓
SWITCH: baseado na escolha
  ├─ Opção 1 → Fluxo: Novo Lançamento
  ├─ Opção 2 → Fluxo: Consultar Gastos
  ├─ Opção 3 → Fluxo: Consultar Receitas
  └─ Opção 4 → Fluxo: Resumo do Mês
```

### Custo: **R$ 0,00** (apenas o VPS)

---

## 💰 Comparação de Custos

### Cenário Simples (Sem OCR/NLP):
| Item | Custo | Necessário? |
|------|-------|-------------|
| **VPS Hostinger KVM 2** | R$ 38,99/mês | ✅ Sim |
| **Evolution API** | Gratuito | ✅ Sim |
| **n8n** | Gratuito | ✅ Sim |
| **Google Vision API** | R$ 0-50/mês | ❌ **NÃO** |
| **OpenAI GPT** | R$ 10-50/mês | ❌ **NÃO** |
| **Google Speech-to-Text** | R$ 0-100/mês | ❌ **NÃO** |
| **TOTAL** | **R$ 38,99/mês** | ✅ |

### Cenário Completo (Com OCR/NLP):
| Item | Custo | Necessário? |
|------|-------|-------------|
| **VPS Hostinger KVM 2** | R$ 38,99/mês | ✅ Sim |
| **Evolution API** | Gratuito | ✅ Sim |
| **n8n** | Gratuito | ✅ Sim |
| **Google Vision API** | R$ 0-50/mês | ✅ Sim (OCR) |
| **OpenAI GPT** | R$ 10-50/mês | ✅ Sim (NLP) |
| **Google Speech-to-Text** | R$ 0-100/mês | ✅ Sim (áudio) |
| **TOTAL** | **R$ 48,99-238,99/mês** | ✅ |

---

## 🎯 Exemplos Práticos

### Exemplo 1: Menu de Opções Completo

**Fluxo no n8n:**

```
1. Webhook recebe: "olá"
   ↓
2. Enviar mensagem com botões:
   "O que deseja fazer?"
   [1️⃣ Novo Lançamento] [2️⃣ Consultar]
   ↓
3. Aguardar resposta
   ↓
4. IF resposta = "1" ou "novo lançamento"
   ↓
5. Enviar: "Qual o tipo?"
   [💰 Receita] [💸 Despesa] [📈 Investimento]
   ↓
6. Aguardar resposta
   ↓
7. IF tipo = "despesa"
   ↓
8. Enviar: "Qual o valor? (ex: 50.00)"
   ↓
9. Aguardar resposta
   ↓
10. Enviar: "Qual a descrição?"
    ↓
11. Aguardar resposta
    ↓
12. Chamar API PHP: POST /api/transactions.php
    {
      "type": "expense",
      "amount": valor_recebido,
      "description": descricao_recebida,
      "date": hoje
    }
    ↓
13. Responder: "✅ Lançamento criado: R$ 50,00 - Supermercado"
```

**Tudo isso SEM APIs pagas!** Apenas lógica no n8n.

---

### Exemplo 2: Anexar Imagem com Descrição

**Fluxo no n8n:**

```
1. Webhook recebe imagem
   ↓
2. Baixar imagem do WhatsApp
   ↓
3. Salvar em: /uploads/attachments/imagem.jpg
   ↓
4. Enviar: "Imagem recebida! Qual a descrição?"
   ↓
5. Aguardar resposta (texto)
   ↓
6. Enviar: "Qual o valor? (ex: 50.00)"
   ↓
7. Aguardar resposta
   ↓
8. Chamar API PHP: POST /api/transactions.php
    {
      "type": "expense",
      "amount": valor_recebido,
      "description": descricao_recebida,
      "attachment_url": "/uploads/attachments/imagem.jpg"
    }
    ↓
9. Responder: "✅ Lançamento criado com anexo!"
```

**Tudo isso SEM OCR!** Apenas salva a imagem e pergunta os dados.

---

## 🔄 Quando Você PRECISA de APIs Pagas?

### ✅ Precisa de Google Vision API (OCR) quando:
- Quer extrair **automaticamente** valor, data, estabelecimento de notas fiscais
- Quer que o sistema **leia** a imagem sem o usuário digitar nada
- Quer processar **muitas** imagens automaticamente

### ✅ Precisa de OpenAI GPT quando:
- Quer que o bot **entenda** linguagem natural livre
- Exemplo: "Gastei 50 reais no mercado hoje"
- Quer que o bot **extraia** informações de texto não estruturado
- Quer respostas mais **naturais** e contextuais

### ✅ Precisa de Google Speech-to-Text quando:
- Quer processar **áudios** do WhatsApp
- Usuário envia áudio ao invés de texto
- Quer converter áudio em texto automaticamente

---

## 🎯 Recomendação por Cenário

### Cenário A: Menu Simples + Anexar Imagens
**Custo:** R$ 38,99/mês (apenas VPS)
- ✅ Evolution API (gratuito)
- ✅ n8n (gratuito)
- ❌ Sem APIs pagas

### Cenário B: Menu + Anexar Imagens + OCR Automático
**Custo:** R$ 38,99-88,99/mês
- ✅ Evolution API (gratuito)
- ✅ n8n (gratuito)
- ✅ Google Vision API (R$ 0-50/mês)

### Cenário C: Menu + Linguagem Natural (GPT)
**Custo:** R$ 48,99-88,99/mês
- ✅ Evolution API (gratuito)
- ✅ n8n (gratuito)
- ✅ OpenAI GPT (R$ 10-50/mês)

### Cenário D: Tudo (Menu + OCR + NLP + Áudio)
**Custo:** R$ 48,99-238,99/mês
- ✅ Evolution API (gratuito)
- ✅ n8n (gratuito)
- ✅ Google Vision API (R$ 0-50/mês)
- ✅ OpenAI GPT (R$ 10-50/mês)
- ✅ Google Speech-to-Text (R$ 0-100/mês)

---

## 📝 Resumo

### Para Seus Cenários:

#### 1. **Apenas anexar imagens:**
- ❌ **NÃO precisa de API paga**
- ✅ Apenas VPS + Evolution API + n8n

#### 2. **Menu de opções:**
- ❌ **NÃO precisa de API paga**
- ✅ Apenas VPS + Evolution API + n8n
- ✅ Lógica simples no n8n é suficiente

### Quando Adicionar APIs Pagas:

- **Google Vision API:** Se quiser extrair dados automaticamente de notas fiscais
- **OpenAI GPT:** Se quiser que o bot entenda linguagem natural livre (sem menu)
- **Google Speech-to-Text:** Se quiser processar áudios

---

## 🚀 Próximos Passos

### Para Começar (Sem APIs Pagas):

1. ✅ Contratar VPS Hostinger KVM 2 (R$ 38,99/mês)
2. ✅ Instalar Evolution API (gratuito)
3. ✅ Instalar n8n (gratuito)
4. ✅ Criar fluxos no n8n:
   - Menu de opções
   - Receber imagens
   - Criar transações via API PHP
5. ✅ Testar tudo
6. ✅ Se precisar depois, adicionar APIs pagas

**Total inicial: R$ 38,99/mês** 🎉

---

**Última atualização:** Janeiro 2025

