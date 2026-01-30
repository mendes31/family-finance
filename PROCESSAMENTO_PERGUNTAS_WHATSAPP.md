# 💬 Processamento de Perguntas no WhatsApp - n8n

## 📋 Pergunta: "Quanto gastei esse mês com gasolina?"

### ✅ **RESPOSTA: SIM, mas depende da abordagem**

---

## 🎯 Duas Abordagens Possíveis

### 1. **SEM GPT (Apenas n8n + Lógica Manual)**
- ⚠️ **Possível, mas limitado**
- ⚠️ **Muito trabalhoso**
- ✅ **Gratuito**

### 2. **COM GPT (n8n + OpenAI)**
- ✅ **Muito mais fácil**
- ✅ **Entende linguagem natural**
- ✅ **Respostas naturais**
- 💰 **Custo: ~R$ 10-30/mês**

---

## 🔧 Abordagem 1: SEM GPT (Apenas n8n)

### Como Funcionaria:

```
WhatsApp → n8n → Extrair dados manualmente → API PHP → Formatar resposta
```

### Fluxo no n8n:

```
1. Receber mensagem: "Quanto gastei esse mês com gasolina?"
   ↓
2. Extrair palavras-chave (regex/padrões):
   - "gastei" → type = "expense"
   - "gasolina" → buscar categoria "Combustível" ou "Gasolina"
   - "esse mês" → calcular startDate e endDate do mês atual
   ↓
3. Buscar categoria no banco:
   - Chamar: GET /api/categories.php?type=expense
   - Filtrar por nome contendo "gasolina" ou "combustível"
   ↓
4. Chamar API PHP:
   GET /api/transactions.php?action=list
   &type=expense
   &categoryId={id_da_categoria}
   &startDate=2025-01-01
   &endDate=2025-01-31
   ↓
5. Somar valores retornados
   ↓
6. Formatar resposta:
   "💰 Você gastou R$ 250,00 com gasolina este mês"
```

### Limitações:

- ❌ Precisa criar padrões para cada tipo de pergunta
- ❌ Não entende variações: "combustível", "posto", "abastecimento"
- ❌ Não entende períodos complexos: "últimos 3 meses", "semana passada"
- ❌ Respostas muito básicas e limitadas
- ❌ Muito código/manutenção

### Exemplo de Código no n8n (JavaScript):

```javascript
// Extrair tipo
const message = $input.item.json.message.toLowerCase();
let type = null;
if (message.includes('gastei') || message.includes('gasto')) {
  type = 'expense';
} else if (message.includes('ganhei') || message.includes('receita')) {
  type = 'income';
}

// Extrair período
let startDate, endDate;
if (message.includes('esse mês') || message.includes('este mês')) {
  const now = new Date();
  startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
} else if (message.includes('mês passado')) {
  const now = new Date();
  startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  endDate = new Date(now.getFullYear(), now.getMonth(), 0);
}

// Buscar categoria (precisa mapear manualmente)
let categoryId = null;
if (message.includes('gasolina') || message.includes('combustível')) {
  // Buscar categoria "Combustível" no banco
  categoryId = await findCategoryByName('Combustível');
}
```

**Complexidade:** ⭐⭐⭐⭐⭐ (Muito alta)

---

## 🚀 Abordagem 2: COM GPT (Recomendado)

### Como Funcionaria:

```
WhatsApp → n8n → GPT (entende pergunta) → API PHP → GPT (formata resposta)
```

### Fluxo no n8n:

```
1. Receber mensagem: "Quanto gastei esse mês com gasolina?"
   ↓
2. Chamar OpenAI GPT para extrair dados:
   Prompt: "Extraia os dados desta pergunta em português:
   'Quanto gastei esse mês com gasolina?'
   
   Retorne JSON:
   {
     'type': 'expense' ou 'income',
     'category': 'nome da categoria',
     'period': 'este mês' ou 'mês passado' ou data específica,
     'startDate': '2025-01-01',
     'endDate': '2025-01-31'
   }"
   ↓
3. GPT retorna:
   {
     "type": "expense",
     "category": "Combustível",
     "period": "este mês",
     "startDate": "2025-01-01",
     "endDate": "2025-01-31"
   }
   ↓
4. Buscar categoria no banco:
   GET /api/categories.php?type=expense&name=Combustível
   ↓
5. Chamar API PHP:
   GET /api/transactions.php?action=list
   &type=expense
   &categoryId={id}
   &startDate=2025-01-01
   &endDate=2025-01-31
   ↓
6. Receber transações e somar valores
   ↓
7. Chamar GPT para formatar resposta:
   Prompt: "Formate esta resposta de forma natural e amigável:
   Pergunta: 'Quanto gastei esse mês com gasolina?'
   Resposta: R$ 250,00 em 3 transações"
   ↓
8. GPT retorna: "💰 Você gastou R$ 250,00 com gasolina este mês (3 abastecimentos)"
   ↓
9. Enviar resposta no WhatsApp
```

### Vantagens:

- ✅ Entende linguagem natural
- ✅ Funciona com variações: "combustível", "posto", "abastecimento"
- ✅ Entende períodos complexos: "últimos 3 meses", "semana passada"
- ✅ Respostas naturais e amigáveis
- ✅ Fácil de manter e expandir

### Custo:

- **OpenAI GPT-3.5-turbo:** ~R$ 0,01-0,05 por pergunta
- **100 perguntas/mês:** ~R$ 1-5/mês
- **500 perguntas/mês:** ~R$ 5-25/mês
- **1000 perguntas/mês:** ~R$ 10-50/mês

**Complexidade:** ⭐⭐ (Baixa)

---

## 📊 Comparação

| Aspecto | SEM GPT | COM GPT |
|---------|---------|---------|
| **Complexidade** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Manutenção** | Muito alta | Baixa |
| **Entende variações** | ❌ Não | ✅ Sim |
| **Períodos complexos** | ❌ Não | ✅ Sim |
| **Respostas naturais** | ❌ Não | ✅ Sim |
| **Custo** | Gratuito | ~R$ 10-30/mês |
| **Recomendação** | ❌ Não | ✅ **SIM** |

---

## 🔧 Exemplo Prático: Implementação com GPT

### Fluxo Completo no n8n:

```javascript
// 1. Receber mensagem do WhatsApp
const message = $input.item.json.message;

// 2. Chamar GPT para extrair dados
const extractionPrompt = `
Extraia os dados desta pergunta financeira em português:
"${message}"

Retorne APENAS um JSON válido com:
{
  "type": "expense" ou "income" ou "investment",
  "category": "nome da categoria (ex: Combustível, Alimentação)",
  "period": "este mês" ou "mês passado" ou "últimos X meses" ou data específica,
  "startDate": "2025-01-01" (formato YYYY-MM-DD),
  "endDate": "2025-01-31" (formato YYYY-MM-DD),
  "questionType": "total" ou "lista" ou "resumo"
}
`;

// Chamar OpenAI
const extraction = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'Você é um assistente que extrai dados de perguntas financeiras. Retorne APENAS JSON válido.' },
    { role: 'user', content: extractionPrompt }
  ],
  response_format: { type: 'json_object' }
});

const data = JSON.parse(extraction.choices[0].message.content);

// 3. Buscar categoria no banco
const categories = await fetch(`${API_URL}/api/categories.php?type=${data.type}`);
const category = categories.find(c => 
  c.name.toLowerCase().includes(data.category.toLowerCase())
);

// 4. Chamar API PHP para buscar transações
const transactions = await fetch(
  `${API_URL}/api/transactions.php?action=list` +
  `&type=${data.type}` +
  `&categoryId=${category.id}` +
  `&startDate=${data.startDate}` +
  `&endDate=${data.endDate}`
);

// 5. Calcular total
const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
const count = transactions.length;

// 6. Formatar resposta com GPT
const responsePrompt = `
Formate esta resposta de forma natural, amigável e em português:

Pergunta: "${message}"
Resposta: Total de R$ ${total.toFixed(2)} em ${count} transação(ões)

Formate de forma conversacional, como se estivesse conversando com um amigo.
`;

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: responsePrompt }
  ]
});

const finalAnswer = response.choices[0].message.content;

// 7. Enviar resposta no WhatsApp
await sendWhatsAppMessage(userPhone, finalAnswer);
```

---

## 📝 Exemplos de Perguntas que Funcionariam

### Com GPT (entende todas):
- ✅ "Quanto gastei esse mês com gasolina?"
- ✅ "Quanto foi de combustível no mês passado?"
- ✅ "Qual meu gasto com posto de gasolina em janeiro?"
- ✅ "Mostre minhas despesas com abastecimento"
- ✅ "Quanto eu ganhei esse mês?"
- ✅ "Qual minha receita total de janeiro?"
- ✅ "Quanto gastei com supermercado nos últimos 3 meses?"

### SEM GPT (só funcionaria com padrões específicos):
- ⚠️ "Quanto gastei esse mês com gasolina?" (precisa mapear "gasolina")
- ❌ "Quanto foi de combustível no mês passado?" (não entende "combustível" = "gasolina")
- ❌ "Mostre minhas despesas com abastecimento" (não entende sinônimos)

---

## 💰 Custo Total Estimado

### Opção 1: SEM GPT
- **VPS:** R$ 38,99/mês
- **GPT:** R$ 0/mês
- **Total:** R$ 38,99/mês
- **Limitações:** Muitas

### Opção 2: COM GPT (Recomendado)
- **VPS:** R$ 38,99/mês
- **GPT-3.5-turbo:** R$ 10-30/mês (500-1000 perguntas)
- **Total:** R$ 48,99-68,99/mês
- **Vantagens:** Muitas

---

## ✅ Recomendação Final

### Para a pergunta "Quanto gastei esse mês com gasolina?":

**SIM, o n8n consegue, mas:**

1. **SEM GPT:** 
   - ⚠️ Funciona, mas muito limitado
   - ⚠️ Precisa mapear cada palavra-chave
   - ⚠️ Não entende variações

2. **COM GPT (Recomendado):**
   - ✅ Funciona perfeitamente
   - ✅ Entende linguagem natural
   - ✅ Respostas naturais
   - ✅ Fácil de expandir
   - 💰 Custo adicional: ~R$ 10-30/mês

**Minha recomendação:** Use GPT-3.5-turbo. O custo adicional é baixo (R$ 10-30/mês) e a experiência do usuário é muito melhor.

---

## 🚀 Próximos Passos

1. ✅ Contratar VPS Hostinger KVM 2 (R$ 38,99/mês)
2. ✅ Instalar Evolution API (gratuito)
3. ✅ Instalar n8n (gratuito)
4. ✅ Criar conta OpenAI (gratuito para começar)
5. ✅ Configurar fluxo no n8n com GPT
6. ✅ Testar perguntas
7. ✅ Ajustar prompts conforme necessário

**Total:** R$ 48,99-68,99/mês (muito acessível!)

---

**Última atualização:** Janeiro 2025

