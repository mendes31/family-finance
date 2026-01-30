# 🌐 Configuração Apache - URL Amigável

## 📋 Objetivo

Configurar a aplicação para ser acessada via Apache do WAMP sem porta, usando URL amigável:
- ✅ `http://localhost/family_finance/dashboard`
- ❌ `http://localhost:8080/family_finance/dashboard`

---

## 🚀 Como Funciona

### Desenvolvimento (Porta 8080)
- Use `npm run dev` para desenvolvimento
- Acesse: `http://localhost:8080/family_finance/dashboard`
- Hot reload e desenvolvimento rápido

### Produção (Apache - Sem Porta)
- Use `npm run build` para gerar os arquivos estáticos
- Acesse: `http://localhost/family_finance/dashboard`
- Servido pelo Apache do WAMP

---

## 📝 Passo a Passo

### 1. Fazer Build da Aplicação

```powershell
npm run build
```

Isso irá:
- ✅ Compilar a aplicação React
- ✅ Gerar arquivos estáticos na pasta `dist/`
- ✅ Copiar o arquivo `.htaccess` automaticamente

### 2. Verificar Estrutura

Após o build, você deve ter:

```
family_finance/
├── dist/                    # Arquivos compilados
│   ├── index.html
│   ├── assets/
│   └── .htaccess           # Configuração Apache
└── ...
```

### 3. Acessar via Apache

A aplicação já está na pasta correta do WAMP:
- **Caminho**: `C:\wamp64\www\family_finance\`
- **URL**: `http://localhost/family_finance/`

### 4. URLs Disponíveis

- **Home**: `http://localhost/family_finance/`
- **Dashboard**: `http://localhost/family_finance/dashboard`
- **Auth**: `http://localhost/family_finance/auth`
- **Transactions**: `http://localhost/family_finance/transactions`
- **Cards**: `http://localhost/family_finance/cards`

---

## ⚙️ Configuração do Apache

O arquivo `.htaccess` já está configurado para:

1. **Rewrites**: Redirecionar todas as rotas para `index.html` (SPA)
2. **Cache**: Cache para assets estáticos, sem cache para HTML
3. **Compressão**: Comprimir arquivos para melhor performance

### Se o .htaccess não funcionar

Verifique se o módulo `mod_rewrite` está habilitado no Apache:

1. Abra o WAMP
2. Clique em Apache → `httpd.conf`
3. Procure por: `#LoadModule rewrite_module`
4. Remova o `#` para habilitar
5. Reinicie o Apache

---

## 🔄 Workflow de Desenvolvimento

### Durante Desenvolvimento:

```powershell
# Terminal 1: Servidor de desenvolvimento (hot reload)
npm run dev
# Acesse: http://localhost:8080/family_finance/dashboard
```

### Para Testar Build de Produção:

```powershell
# Fazer build
npm run build

# Acessar via Apache
# http://localhost/family_finance/dashboard
```

---

## 📁 Estrutura de Arquivos

```
C:\wamp64\www\
└── family_finance/          # Pasta do projeto
    ├── dist/                # Build de produção (servido pelo Apache)
    │   ├── index.html
    │   ├── assets/
    │   └── .htaccess
    ├── src/                 # Código fonte
    ├── public/              # Arquivos públicos
    │   └── .htaccess        # Template (copiado para dist/)
    └── ...
```

---

## ⚠️ Importante

1. **Durante desenvolvimento**: Use `npm run dev` (porta 8080)
2. **Para produção/teste**: Use `npm run build` e acesse via Apache
3. **Após cada build**: O `.htaccess` é copiado automaticamente
4. **Base path**: Já configurado como `/family_finance/`

---

## 🔧 Troubleshooting

### Erro 404 ao acessar rotas

**Causa**: Apache não está processando o `.htaccess`

**Solução**:
1. Verifique se `mod_rewrite` está habilitado
2. Verifique se o `.htaccess` está na pasta `dist/`
3. Verifique as permissões do Apache

### Assets não carregam

**Causa**: Caminhos incorretos

**Solução**: 
- O Vite já está configurado com `base: "/family_finance/"`
- Os assets devem carregar automaticamente

### Página em branco

**Causa**: Build não foi feito ou está desatualizado

**Solução**:
```powershell
npm run build
```

---

## 📚 Referências

- **Vite Base Path**: https://vitejs.dev/config/shared-options.html#base
- **Apache mod_rewrite**: https://httpd.apache.org/docs/current/mod/mod_rewrite.html

---

**Última atualização**: 2026-01-05

