# 🔄 Como Atualizar o Build na Raiz

## 📋 Situação Atual

Os arquivos de `dist/` foram copiados para a raiz do projeto para que o Apache possa servi-los diretamente.

---

## 🔄 Quando Fazer Build Novamente

Sempre que você fizer alterações no código e quiser ver no navegador:

### Passo 1: Fazer Build

```powershell
npm run build
```

### Passo 2: Copiar para Raiz

```powershell
php copiar_build_para_raiz.php
```

Ou manualmente:

```powershell
Copy-Item -Path dist\* -Destination . -Recurse -Force
Copy-Item -Path dist\.htaccess -Destination .htaccess -Force
```

---

## 🚀 Workflow Recomendado

### Durante Desenvolvimento:

```powershell
# Terminal 1: Servidor de desenvolvimento (hot reload)
npm run dev
# Acesse: http://localhost:8080/family_finance/dashboard
```

### Para Testar Build de Produção:

```powershell
# 1. Fazer build
npm run build

# 2. Copiar para raiz
php copiar_build_para_raiz.php

# 3. Acessar via Apache
# http://localhost/family_finance/dashboard
```

---

## ⚠️ Importante

- **Durante desenvolvimento**: Use `npm run dev` (não precisa copiar)
- **Para produção/teste**: Use `npm run build` + copiar para raiz
- **Não commite** os arquivos da raiz que vieram de `dist/` (já estão no `.gitignore`)

---

## 📁 Estrutura Atual

```
family_finance/
├── dist/              # Build (fonte)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
├── index.html         # Build copiado (servido pelo Apache)
├── assets/            # Assets copiados (servido pelo Apache)
├── .htaccess          # Configuração Apache
├── src/               # Código fonte
└── ...
```

---

**Última atualização**: 2026-01-05

