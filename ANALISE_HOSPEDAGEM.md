# 🚀 Análise de Hospedagem - Family Finance Hub

## 📋 Resumo do Projeto

**Stack Tecnológica:**
- **Frontend:** React 18 + TypeScript + Vite (SPA - arquivos estáticos após build)
- **Backend:** PHP 7.4+ com API REST
- **Banco de Dados:** MySQL 5.7+ ou MariaDB 10.3+
- **Email:** PHPMailer (SMTP)
- **Servidor Web:** Apache (com .htaccess) ou Nginx
- **Upload:** Sistema de anexos (pasta `uploads/`)

**Requisitos Técnicos:**
- ✅ PHP 7.4 ou superior
- ✅ MySQL/MariaDB
- ✅ Apache com mod_rewrite OU Nginx com configuração customizada
- ✅ Composer (para dependências PHP)
- ✅ SSL/HTTPS (recomendado)
- ✅ Suporte a sessões PHP
- ✅ Permissões de escrita (uploads/)

---

## 🏆 Recomendações por Perfil

### 🥇 **MELHOR OPÇÃO GERAL: Hostinger**

**Por quê?**
- ✅ Excelente custo-benefício (R$ 8-15/mês)
- ✅ PHP 8.x + MySQL incluído
- ✅ cPanel completo e intuitivo
- ✅ SSL gratuito (Let's Encrypt)
- ✅ Suporte em português
- ✅ Servidores no Brasil (latência baixa)
- ✅ Backup automático
- ✅ Ideal para projetos PHP

**Plano Recomendado:** Single Shared Hosting (R$ 8,99/mês)
- 1 site
- 50 GB de armazenamento
- 100 GB de largura de banda
- MySQL ilimitado
- Email ilimitado

**Link:** https://www.hostinger.com.br

---

### 🥈 **MELHOR PARA INICIANTES: HostGator Brasil**

**Por quê?**
- ✅ Interface muito simples (cPanel)
- ✅ Suporte 24/7 em português
- ✅ Tutoriais em português
- ✅ PHP + MySQL pré-configurado
- ✅ SSL gratuito
- ✅ Preço acessível

**Plano Recomendado:** Plano Hatchling (R$ 9,99/mês)
- 1 domínio
- 10 GB de armazenamento
- MySQL ilimitado
- Email ilimitado

**Link:** https://www.hostgator.com.br

---

### 🥉 **MELHOR CUSTO-BENEFÍCIO: KingHost**

**Por quê?**
- ✅ Empresa brasileira (suporte local)
- ✅ Preços muito competitivos
- ✅ PHP 8.x + MySQL
- ✅ cPanel completo
- ✅ SSL gratuito
- ✅ Servidores no Brasil

**Plano Recomendado:** Plano Básico (R$ 7,90/mês)
- 1 domínio
- 5 GB de armazenamento
- MySQL ilimitado
- Email ilimitado

**Link:** https://www.kinghost.com.br

---

### 💎 **MELHOR PARA ESCALABILIDADE: DigitalOcean**

**Por quê?**
- ✅ VPS completo (controle total)
- ✅ Escalável (começa pequeno, cresce conforme necessário)
- ✅ Múltiplas opções de servidor
- ✅ Documentação excelente
- ✅ Preço por uso (R$ 20-40/mês para começar)

**Plano Recomendado:** Droplet Básico (R$ 20/mês)
- 1 vCPU
- 1 GB RAM
- 25 GB SSD
- 1 TB transferência

**Link:** https://www.digitalocean.com

**⚠️ Requer conhecimento técnico** (configuração manual de servidor)

---

### 🌟 **MELHOR PARA DESENVOLVIMENTO: Vercel + Railway**

**Por quê?**
- ✅ Deploy automático via Git
- ✅ Frontend na Vercel (gratuito para SPAs)
- ✅ Backend PHP na Railway
- ✅ MySQL na Railway ou PlanetScale
- ✅ SSL automático
- ✅ CDN global

**Estrutura:**
- **Frontend (Vercel):** Gratuito
- **Backend (Railway):** ~R$ 15-30/mês
- **MySQL (Railway):** ~R$ 10-20/mês

**⚠️ Requer refatoração:** Separar frontend e backend

**Links:**
- Vercel: https://vercel.com
- Railway: https://railway.app

---

## 📊 Comparação Detalhada

| Hospedagem | Preço/mês | PHP | MySQL | SSL | cPanel | Suporte PT | Melhor Para |
|------------|-----------|-----|-------|-----|--------|------------|-------------|
| **Hostinger** | R$ 8-15 | ✅ 8.x | ✅ | ✅ Grátis | ✅ | ✅ | **Melhor Geral** |
| **HostGator** | R$ 10-20 | ✅ 8.x | ✅ | ✅ Grátis | ✅ | ✅ | Iniciantes |
| **KingHost** | R$ 8-12 | ✅ 8.x | ✅ | ✅ Grátis | ✅ | ✅ | Custo-benefício |
| **DigitalOcean** | R$ 20-40 | ✅ | ✅ | ✅ | ❌ | ❌ | Escalabilidade |
| **Locaweb** | R$ 15-30 | ✅ 8.x | ✅ | ✅ Grátis | ✅ | ✅ | Empresas BR |
| **UOL Host** | R$ 20-40 | ✅ 8.x | ✅ | ✅ Grátis | ✅ | ✅ | Tradicional |
| **Vercel+Railway** | R$ 0-50 | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | Desenvolvedores |

---

## 🎯 Recomendação Final

### Para a Maioria dos Casos: **Hostinger**

**Motivos:**
1. ✅ **Preço justo** (R$ 8,99/mês no primeiro ano)
2. ✅ **Tudo incluído:** PHP, MySQL, SSL, cPanel
3. ✅ **Fácil de configurar** (upload via FTP/cPanel)
4. ✅ **Suporte em português**
5. ✅ **Servidores no Brasil** (baixa latência)
6. ✅ **Backup automático**
7. ✅ **Ideal para PHP + MySQL**

### Passos para Deploy na Hostinger:

1. **Comprar domínio** (ou usar subdomínio gratuito)
2. **Contratar plano** Single Shared Hosting
3. **Acessar cPanel**
4. **Criar banco MySQL** (via cPanel)
5. **Upload dos arquivos:**
   - Frontend (pasta `dist/`) → `public_html/`
   - Backend (pasta `api/`) → `public_html/api/`
   - Uploads → `public_html/uploads/`
6. **Configurar `.env`** com credenciais do MySQL
7. **Instalar Composer** (via cPanel ou SSH)
8. **Configurar SSL** (Let's Encrypt gratuito)
9. **Testar aplicação**

---

## 🔧 Configurações Necessárias

### 1. Estrutura de Pastas na Hospedagem

```
public_html/
├── index.html          (do build)
├── assets/            (do build)
├── api/               (backend PHP)
│   ├── config.php
│   ├── auth.php
│   └── ...
├── uploads/           (anexos)
│   └── attachments/
└── .htaccess          (rewrite rules)
```

### 2. Configuração do .htaccess

```apache
# Habilitar mod_rewrite
RewriteEngine On

# Redirecionar para HTTPS (opcional mas recomendado)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L]

# SPA routes (React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

### 3. Variáveis de Ambiente (.env)

```env
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASS=sua_senha_mysql
DB_NAME=family_finance
DB_PORT=3306

ENCRYPTION_KEY=chave_secreta_aleatoria_aqui

# SMTP (configurar no painel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
```

### 4. Permissões de Pastas

```bash
# Via cPanel File Manager ou SSH
chmod 755 public_html/
chmod 755 public_html/api/
chmod 777 public_html/uploads/  # Permissão de escrita
```

---

## ⚠️ Pontos de Atenção

### 1. **Base Path**
- Seu projeto usa `/family_finance/` como base path
- Na hospedagem, você pode:
  - **Opção A:** Instalar na raiz (`/`) e remover base path
  - **Opção B:** Instalar em subpasta (`/family_finance/`) e manter

### 2. **PHP Version**
- Verificar se hospedagem suporta PHP 7.4+
- Recomendado: PHP 8.0 ou superior

### 3. **MySQL Version**
- Verificar se suporta MySQL 5.7+ ou MariaDB 10.3+
- Recomendado: MySQL 8.0 ou MariaDB 10.6+

### 4. **Upload de Arquivos**
- Verificar limite de upload (php.ini)
- Padrão: 2MB (pode precisar aumentar)

### 5. **Composer**
- Algumas hospedagens não incluem Composer
- Solução: Instalar via SSH ou usar PHPMailer manualmente

### 6. **SSL/HTTPS**
- **OBRIGATÓRIO** para produção
- Let's Encrypt é gratuito na maioria das hospedagens

---

## 📝 Checklist de Deploy

### Antes do Deploy:
- [ ] Fazer build do frontend (`npm run build`)
- [ ] Testar build localmente
- [ ] Verificar variáveis de ambiente
- [ ] Backup do banco de dados local
- [ ] Documentar credenciais SMTP

### Durante o Deploy:
- [ ] Criar banco MySQL na hospedagem
- [ ] Importar estrutura do banco (SQL)
- [ ] Upload dos arquivos
- [ ] Configurar `.env` com credenciais corretas
- [ ] Instalar dependências PHP (Composer)
- [ ] Configurar permissões de pastas
- [ ] Configurar `.htaccess`
- [ ] Configurar SSL/HTTPS

### Após o Deploy:
- [ ] Testar login/registro
- [ ] Testar criação de transações
- [ ] Testar upload de anexos
- [ ] Testar envio de emails
- [ ] Verificar performance
- [ ] Configurar backup automático
- [ ] Monitorar logs de erro

---

## 💰 Estimativa de Custos

### Opção 1: Hospedagem Compartilhada (Recomendada)
- **Hospedagem:** R$ 8-15/mês
- **Domínio:** R$ 30-50/ano (ou gratuito no primeiro ano)
- **Total:** ~R$ 10-20/mês

### Opção 2: VPS
- **VPS:** R$ 20-40/mês
- **Domínio:** R$ 30-50/ano
- **Total:** ~R$ 25-45/mês

### Opção 3: Cloud (Vercel + Railway)
- **Frontend (Vercel):** Gratuito
- **Backend (Railway):** R$ 15-30/mês
- **MySQL (Railway):** R$ 10-20/mês
- **Domínio:** R$ 30-50/ano
- **Total:** ~R$ 25-50/mês

---

## 🚀 Próximos Passos

1. **Escolher hospedagem** (recomendado: Hostinger)
2. **Comprar domínio** (ou usar subdomínio)
3. **Contratar plano** de hospedagem
4. **Preparar build** para produção
5. **Fazer deploy** seguindo checklist
6. **Testar** todas as funcionalidades
7. **Configurar backup** automático
8. **Monitorar** performance e erros

---

## 📚 Recursos Úteis

- [Hostinger - Guia de Deploy PHP](https://www.hostinger.com.br/tutoriais/como-fazer-upload-de-arquivos-php)
- [cPanel - Documentação](https://docs.cpanel.net/)
- [Let's Encrypt - SSL Gratuito](https://letsencrypt.org/)
- [PHP.net - Documentação](https://www.php.net/docs.php)

---

**Última atualização:** Janeiro 2025

