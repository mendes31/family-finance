# 🔧 Troubleshooting - Página em Branco

## 🔍 Problema: Página em Branco ao Acessar `http://localhost/family_finance/`

### Possíveis Causas e Soluções

---

## ✅ Solução 1: Verificar se Apache está servindo a pasta `dist/`

O Apache do WAMP serve arquivos da pasta `www`, mas precisa acessar a pasta `dist/` dentro do projeto.

### Opção A: Acessar diretamente a pasta dist

Tente acessar:
```
http://localhost/family_finance/dist/
```

Se funcionar, o problema é que o Apache não está redirecionando corretamente.

### Opção B: Mover conteúdo de dist para raiz (Temporário)

```powershell
# Fazer backup do que está na raiz (se houver)
# Copiar conteúdo de dist para raiz
Copy-Item -Path dist\* -Destination . -Recurse -Force
```

**⚠️ Nota**: Isso é temporário. O ideal é configurar o Apache corretamente.

---

## ✅ Solução 2: Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Verifique se há erros de JavaScript
4. Vá na aba **Network**
5. Verifique se os arquivos `.js` e `.css` estão carregando

**Erros comuns:**
- `404` nos arquivos `.js` ou `.css` → Problema de caminho
- `CORS error` → Problema de configuração do Apache
- `Failed to load module` → Problema com o base path

---

## ✅ Solução 3: Verificar .htaccess

### Verificar se está na pasta correta:

O `.htaccess` deve estar em:
- `C:\wamp64\www\family_finance\dist\.htaccess` (se servir dist/)
- OU `C:\wamp64\www\family_finance\.htaccess` (se servir raiz)

### Verificar se mod_rewrite está habilitado:

1. Abra o WAMP
2. Clique em **Apache** → **httpd.conf**
3. Procure por: `#LoadModule rewrite_module`
4. Remova o `#` se estiver comentado
5. Procure por: `<Directory "c:/wamp64/www">`
6. Certifique-se de que `AllowOverride All` está configurado
7. Reinicie o Apache

---

## ✅ Solução 4: Verificar Caminhos dos Assets

Os arquivos JavaScript e CSS devem estar em:
```
http://localhost/family_finance/assets/index-XXXXX.js
http://localhost/family_finance/assets/index-XXXXX.css
```

Teste acessando diretamente:
```
http://localhost/family_finance/assets/index-BP8gd204.js
```

Se der 404, o problema é o caminho dos assets.

---

## ✅ Solução 5: Rebuild e Limpar Cache

```powershell
# Limpar pasta dist
Remove-Item -Path dist -Recurse -Force

# Fazer build novamente
npm run build

# Limpar cache do navegador (Ctrl + Shift + Delete)
```

---

## ✅ Solução 6: Verificar Estrutura de Pastas

A estrutura correta deve ser:

```
C:\wamp64\www\
└── family_finance/
    ├── dist/              # Arquivos compilados (servidos pelo Apache)
    │   ├── index.html
    │   ├── assets/
    │   └── .htaccess
    ├── src/               # Código fonte
    └── ...
```

O Apache deve servir os arquivos de `dist/` quando acessar `http://localhost/family_finance/`

---

## 🔍 Diagnóstico Rápido

Execute estes comandos para diagnosticar:

```powershell
# 1. Verificar se index.html existe
Test-Path dist\index.html

# 2. Verificar se .htaccess existe
Test-Path dist\.htaccess

# 3. Verificar se assets existem
Test-Path dist\assets\index-*.js

# 4. Verificar conteúdo do index.html
Get-Content dist\index.html | Select-String "script"
```

---

## 📝 Próximos Passos

1. **Verifique o console do navegador** (F12) para erros
2. **Teste acessar diretamente**: `http://localhost/family_finance/dist/`
3. **Verifique os logs do Apache** se houver erros
4. **Teste em modo anônimo** para descartar cache

---

**Última atualização**: 2026-01-05

