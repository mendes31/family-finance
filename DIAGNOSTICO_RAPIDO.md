# 🔍 Diagnóstico Rápido - Página em Branco

## ⚡ Teste Imediato

### 1. Abra o Console do Navegador

1. Acesse: `http://localhost/family_finance/`
2. Pressione **F12**
3. Vá na aba **Console**
4. **Me informe quais erros aparecem** (se houver)

### 2. Teste Acessar Diretamente

Tente acessar:
```
http://localhost/family_finance/dist/
```

**Se funcionar**: O problema é o `.htaccess` ou configuração do Apache  
**Se não funcionar**: O problema pode ser caminho dos assets

### 3. Verificar Network (Rede)

1. No DevTools (F12), vá na aba **Network**
2. Recarregue a página (F5)
3. Verifique se os arquivos `.js` e `.css` estão carregando
4. Se algum der **404**, esse é o problema

---

## 🎯 Solução Temporária (Funciona Imediatamente)

Se precisar de uma solução rápida, copie o conteúdo de `dist/` para a raiz:

```powershell
# Na raiz do projeto
Copy-Item -Path dist\* -Destination . -Recurse -Force
Copy-Item -Path dist\.htaccess -Destination .htaccess -Force
```

Depois acesse: `http://localhost/family_finance/`

**⚠️ Nota**: Isso não é ideal, mas funciona para testar.

---

## 📋 Informações que Preciso

Para ajudar melhor, me informe:

1. **O que aparece no Console** (F12 → Console)?
2. **O que aparece na aba Network** (F12 → Network)?
3. **Consegue acessar** `http://localhost/family_finance/dist/`?
4. **Os arquivos JS/CSS carregam** ou dão 404?

---

**Última atualização**: 2026-01-05

