# 🔌 API PHP - Family Finance

API REST para comunicação entre o frontend React e o banco de dados MySQL.

## 📁 Estrutura

```
api/
├── config.php      # Configurações e funções auxiliares
├── auth.php        # Endpoints de autenticação
└── .htaccess       # Configuração Apache
```

## 🔐 Autenticação

### Endpoints

#### POST `/api/auth.php?action=signup`
Cria uma nova conta de usuário.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "fullName": "Nome Completo"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome Completo"
  },
  "message": "Conta criada com sucesso"
}
```

#### POST `/api/auth.php?action=signin`
Faz login do usuário.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome Completo"
  },
  "message": "Login realizado com sucesso"
}
```

#### POST `/api/auth.php?action=signout`
Faz logout do usuário.

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

#### GET `/api/auth.php?action=session`
Verifica se há uma sessão ativa.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome Completo"
  }
}
```

ou

```json
{
  "user": null
}
```

## 🔧 Configuração

A API lê as configurações do arquivo `.env` na raiz do projeto:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=family_finance
DB_PORT=3306
```

## 🔒 Segurança

- Senhas são hasheadas com `password_hash()` (BCRYPT)
- Sessões PHP são usadas para manter autenticação
- CORS configurado para `http://localhost`
- Validação de entrada em todos os endpoints

## 📝 Próximos Passos

- [ ] Criar endpoints para transações
- [ ] Criar endpoints para categorias
- [ ] Criar endpoints para cartões de crédito
- [ ] Criar endpoints para famílias
- [ ] Implementar middleware de autenticação
- [ ] Adicionar rate limiting

---

**Última atualização**: 2026-01-05

