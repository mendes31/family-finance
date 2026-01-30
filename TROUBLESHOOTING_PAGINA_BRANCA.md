# 🔍 Troubleshooting - Página em Branco

## ❌ Problema
Ao acessar `http://localhost/family_finance/auth`, a página aparece em branco.

## ✅ Soluções

### 1. Verificar Console do Navegador (F12)
- Pressione **F12** no navegador
- Vá na aba **Console**
- Verifique se há erros de JavaScript
- Erros comuns:
  - `404 Not Found` nos arquivos JS/CSS
  - Erros de CORS
  - Erros de sintaxe JavaScript

### 2. Verificar se os Assets Estão Acessíveis
Teste diretamente no navegador:
- `http://localhost/family_finance/assets/index-CK75MOnf.js`
- `http://localhost/family_finance/assets/index-lN2WdpBO.css`

Se retornar 404, os arquivos não estão no lugar correto.

### 3. Fazer Novo Build
```powershell
npm run build
```

Depois copiar os arquivos:
```powershell
php copiar_build_para_raiz.php
```

### 4. Verificar .htaccess
Certifique-se de que o `.htaccess` está na raiz do projeto e que o Apache tem `mod_rewrite` habilitado.

### 5. Limpar Cache do Navegador
- `Ctrl + Shift + R` (recarregar forçado)
- Ou abra em modo anônimo: `Ctrl + Shift + N`

### 6. Verificar se o Apache Está Servindo Corretamente
Teste se o Apache está funcionando:
- `http://localhost/family_finance/` (deve mostrar algo)
- Verifique os logs do Apache em caso de erros

---

## 🔧 Solução Rápida

1. **Abra o Console do Navegador (F12)**
2. **Me informe qual erro aparece**
3. **Ou execute:**
   ```powershell
   npm run build
   php copiar_build_para_raiz.php
   ```

---

**Última atualização**: 2026-01-05

