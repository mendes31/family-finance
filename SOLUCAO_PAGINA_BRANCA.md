# 🔧 Solução: Página em Branco

## 🔍 Diagnóstico

A página está em branco ao acessar `http://localhost/family_finance/`.

### Verificações Realizadas:

✅ Build feito com sucesso  
✅ Arquivo `dist/index.html` existe  
✅ Arquivo `dist/.htaccess` existe  
✅ Assets compilados corretamente  

---

## 🎯 Solução Rápida

### Opção 1: Acessar diretamente a pasta dist

Tente acessar:
```
http://localhost/family_finance/dist/
```

Se funcionar, o problema é a configuração do `.htaccess` ou do Apache.

### Opção 2: Mover conteúdo para raiz (Temporário)

Se você quer que o Apache sirva diretamente da raiz:

```powershell
# Copiar conteúdo de dist para raiz
Copy-Item -Path dist\* -Destination . -Recurse -Force

# Copiar .htaccess também
Copy-Item -Path dist\.htaccess -Destination .htaccess -Force
```

Depois acesse: `http://localhost/family_finance/`

**⚠️ Nota**: Isso mistura código fonte com build. Não é ideal, mas funciona para teste.

---

## 🔍 Verificar Console do Navegador

1. Abra `http://localhost/family_finance/`
2. Pressione **F12** (DevTools)
3. Vá na aba **Console**
4. Veja se há erros (vermelho)

**Erros comuns:**
- `Failed to load module` → Problema com caminho dos assets
- `404` nos arquivos JS/CSS → Caminho incorreto
- `CORS error` → Problema de configuração

---

## ⚙️ Verificar Configuração do Apache

### 1. Habilitar mod_rewrite

1. WAMP → Apache → `httpd.conf`
2. Procure: `#LoadModule rewrite_module`
3. Remova o `#`
4. Salve e reinicie Apache

### 2. Permitir .htaccess

No `httpd.conf`, procure:
```apache
<Directory "c:/wamp64/www">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

Altere para:
```apache
<Directory "c:/wamp64/www">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

Reinicie o Apache.

---

## 🚀 Teste Rápido

Execute este comando para testar se os arquivos estão acessíveis:

```powershell
# Testar se index.html está acessível
Invoke-WebRequest -Uri "http://localhost/family_finance/dist/index.html" -UseBasicParsing
```

---

## 📝 Próxima Ação Recomendada

1. **Abra o DevTools** (F12) e veja os erros no Console
2. **Teste acessar**: `http://localhost/family_finance/dist/`
3. **Me informe** qual erro aparece no console

Isso ajudará a identificar o problema exato.

