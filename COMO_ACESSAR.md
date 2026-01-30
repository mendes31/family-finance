# 🌐 Como Acessar a Aplicação

## 🚀 URL Amigável (Apache - Sem Porta)

A aplicação está configurada para ser acessada via Apache do WAMP:

### URLs Disponíveis:

- **Home**: `http://localhost/family_finance/`
- **Dashboard**: `http://localhost/family_finance/dashboard`
- **Auth**: `http://localhost/family_finance/auth`
- **Transactions**: `http://localhost/family_finance/transactions`
- **Cards**: `http://localhost/family_finance/cards`

---

## 📋 Pré-requisitos

1. ✅ WAMP instalado e rodando
2. ✅ Apache rodando (ícone verde no WAMP)
3. ✅ Build feito (`npm run build`)

---

## 🔄 Workflow

### Para Desenvolvimento (com hot reload):

```powershell
npm run dev
# Acesse: http://localhost:8080/family_finance/dashboard
```

### Para Produção/Teste (via Apache):

```powershell
# 1. Fazer build
npm run build

# 2. Acessar via navegador
# http://localhost/family_finance/dashboard
```

---

## ⚙️ Configuração do Apache

### Verificar se mod_rewrite está habilitado:

1. Abra o WAMP
2. Clique em **Apache** → **httpd.conf**
3. Procure por: `#LoadModule rewrite_module`
4. Se tiver `#`, remova para habilitar
5. Salve e reinicie o Apache

### Se o .htaccess não funcionar:

1. Verifique se o arquivo `dist/.htaccess` existe
2. Verifique as permissões do Apache
3. Verifique os logs do Apache em caso de erro

---

## ✅ Status Atual

- ✅ Base path configurado: `/family_finance/`
- ✅ Build feito com sucesso
- ✅ `.htaccess` copiado para `dist/`
- ✅ React Router configurado com `basename`

---

## 🔍 Verificar se Está Funcionando

1. Acesse: `http://localhost/family_finance/`
2. Deve carregar a página inicial
3. Navegue para: `http://localhost/family_finance/dashboard`
4. Deve funcionar sem erros 404

---

## ⚠️ Problemas Comuns

### Erro 404 ao acessar rotas

**Solução**: Verifique se `mod_rewrite` está habilitado no Apache

### Página em branco

**Solução**: 
1. Faça o build novamente: `npm run build`
2. Limpe o cache do navegador (Ctrl + F5)

### Assets não carregam

**Solução**: 
- Verifique se o base path está correto no `vite.config.ts`
- Verifique o console do navegador para erros

---

**Última atualização**: 2026-01-05

