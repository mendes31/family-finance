# 🚀 Como Iniciar o Servidor de Desenvolvimento

## 📋 Pré-requisitos

- ✅ Node.js instalado
- ✅ Dependências instaladas (`npm install`)

---

## 🚀 Iniciar o Servidor

### No Terminal/PowerShell:

```powershell
# Na raiz do projeto
npm run dev
```

O servidor Vite iniciará e você verá algo como:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Acessar no Navegador:

Abra: **http://localhost:8080**

---

## ⚠️ Problemas Comuns

### Erro: "Port 8080 is already in use"

**Solução**: Altere a porta no arquivo `vite.config.ts` ou use outra porta:

```powershell
npm run dev -- --port 3001
```

### Erro: "Cannot find module"

**Solução**: Instale as dependências:

```powershell
npm install
```

### Erro: "ERR_CONNECTION_REFUSED"

**Causa**: O servidor não está rodando.

**Solução**: 
1. Execute `npm run dev` no terminal
2. Aguarde a mensagem "ready"
3. Acesse `http://localhost:8080`

---

## 🔧 Comandos Úteis

```powershell
# Iniciar servidor
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## 📝 Nota

O servidor deve estar rodando para acessar a aplicação. Se você fechar o terminal, o servidor será encerrado.

Para rodar em background permanente, considere usar `pm2` ou similar.

---

**Última atualização**: 2026-01-05

