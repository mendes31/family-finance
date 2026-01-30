# 🧹 Como Limpar Cache do Navegador

## 🔍 Problema: Página em Branco ou Erros 404

Mesmo após atualizar os arquivos, o navegador pode estar usando versões antigas em cache.

---

## ✅ Soluções Rápidas

### 1. Recarregar Forçado (Mais Rápido)

**Windows/Linux:**
- `Ctrl + Shift + R`
- `Ctrl + F5`

**Mac:**
- `Cmd + Shift + R`

### 2. Limpar Cache Manualmente

1. Pressione **F12** (abrir DevTools)
2. Clique com botão direito no botão **Recarregar** (ao lado da barra de endereço)
3. Selecione **"Limpar cache e recarregar forçado"**

### 3. Limpar Cache Completo

**Chrome/Edge:**
1. `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Período: "Última hora" ou "Todo o período"
4. Clique em "Limpar dados"

**Firefox:**
1. `Ctrl + Shift + Delete`
2. Marque "Cache"
3. Clique em "Limpar agora"

### 4. Modo Anônimo (Teste Rápido)

**Chrome/Edge:**
- `Ctrl + Shift + N`

**Firefox:**
- `Ctrl + Shift + P`

Acesse: `http://localhost/family_finance/`

---

## 🔍 Verificar se Arquivos Estão Corretos

### Verificar index.html:

```powershell
Get-Content index.html | Select-String "script"
```

Deve mostrar:
```html
<script type="module" crossorigin src="/family_finance/assets/index-XXXXX.js"></script>
```

### Verificar se assets existem:

```powershell
Test-Path assets\index-*.js
```

Deve retornar: `True`

---

## ⚠️ Se Ainda Não Funcionar

1. **Feche completamente o navegador** (todas as abas)
2. **Abra novamente**
3. **Acesse em modo anônimo**
4. **Verifique o Console** (F12) para novos erros

---

**Última atualização**: 2026-01-05

