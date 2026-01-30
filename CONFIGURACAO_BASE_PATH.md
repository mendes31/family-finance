# 🔧 Configuração do Base Path

## 📋 O que foi configurado

A aplicação foi configurada para funcionar com o base path `/family_finance/`.

### URLs de Acesso

- **Home**: `http://localhost:8080/family_finance/`
- **Dashboard**: `http://localhost:8080/family_finance/dashboard`
- **Auth**: `http://localhost:8080/family_finance/auth`
- **Transactions**: `http://localhost:8080/family_finance/transactions`
- **Cards**: `http://localhost:8080/family_finance/cards`

---

## ✅ Alterações Realizadas

### 1. `vite.config.ts`
- Adicionado `base: "/family_finance/"`

### 2. `src/App.tsx`
- Adicionado `basename="/family_finance"` no `BrowserRouter`

### 3. `src/pages/NotFound.tsx`
- Substituído `<a href="/">` por `<Link to="/">` para usar React Router

### 4. `src/hooks/useAuth.tsx`
- Ajustado `redirectUrl` para incluir o base path

---

## 🔄 Reiniciar o Servidor

Após essas alterações, **reinicie o servidor de desenvolvimento**:

```powershell
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

---

## 📝 Notas

- Todas as rotas internas (usando `Link` ou `navigate`) funcionam automaticamente
- O React Router gerencia o base path automaticamente
- Links externos ou redirecionamentos devem usar o caminho completo

---

## ⚠️ Importante

Se você mudar o base path no futuro:

1. Atualize `vite.config.ts` → `base`
2. Atualize `src/App.tsx` → `basename` no BrowserRouter
3. Verifique redirecionamentos que usam `window.location`

---

**Última atualização**: 2026-01-05

