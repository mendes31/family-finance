# 📋 Instruções para Executar o Schema

## ✅ Pré-requisitos

- [x] Banco de dados `family_finance` criado no phpMyAdmin
- [x] phpMyAdmin acessível em `http://localhost/phpmyadmin`

---

## 🚀 Passo a Passo

### 1. Executar o Schema (Criar Tabelas)

1. Abra o phpMyAdmin: `http://localhost/phpmyadmin`
2. No menu lateral, selecione o banco **`family_finance`**
3. Clique na aba **"SQL"** no topo
4. Abra o arquivo `database/schema.sql` em um editor de texto
5. **Copie TODO o conteúdo** do arquivo
6. Cole no campo SQL do phpMyAdmin
7. Clique em **"Executar"** ou **"Go"**
8. Aguarde a execução (pode levar alguns segundos)
9. Verifique se apareceu a mensagem de sucesso

**Resultado esperado**: Você deve ver 11 tabelas criadas:
- `users`
- `families`
- `profiles`
- `user_roles`
- `family_members`
- `categories`
- `credit_cards`
- `transactions`
- `budgets`
- `financial_goals`
- `alerts`

### 2. (Opcional) Executar o Seed (Dados Iniciais)

**Opção A: Usando seed.sql (requer função generate_uuid())**

1. No phpMyAdmin, certifique-se de que o banco `family_finance` está selecionado
2. Clique na aba **"SQL"**
3. Abra o arquivo `database/seed.sql` em um editor de texto
4. **Copie TODO o conteúdo** do arquivo
5. Cole no campo SQL do phpMyAdmin
6. Clique em **"Executar"**
7. Verifique se as categorias padrão foram inseridas

**Opção B: Usando seed_alternativo.sql (sem função UUID)**

1. Se o `seed.sql` der erro de função não encontrada, use `seed_alternativo.sql`
2. Siga os mesmos passos acima, mas usando o arquivo `seed_alternativo.sql`

**Opção C: Deixar o backend inserir**

- Você pode pular o seed e deixar o backend inserir as categorias padrão programaticamente ao iniciar

**Resultado esperado**: 16 categorias padrão inseridas (4 de receita, 8 de despesa, 4 de investimento)

---

## 🔍 Verificar se Funcionou

### Ver todas as tabelas:

1. No phpMyAdmin, selecione o banco `family_finance`
2. Você deve ver 11 tabelas listadas no menu lateral
3. Clique em uma tabela para ver sua estrutura

### Ver dados iniciais:

1. Clique na tabela `categories`
2. Clique na aba **"Visualizar"** ou **"Browse"**
3. Você deve ver 16 categorias (se executou o seed)

---

## ⚠️ Problemas Comuns

### Erro: "Table already exists"

**Causa**: As tabelas já foram criadas anteriormente.

**Solução**: 
- Se quiser recriar tudo, delete o banco e crie novamente:
  ```sql
  DROP DATABASE family_finance;
  CREATE DATABASE family_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- Depois execute o schema novamente.

### Erro: "Unknown database 'family_finance'"

**Causa**: O banco de dados não foi criado.

**Solução**: Siga o guia `GUIA_PHPMYADMIN.md` para criar o banco primeiro.

### Erro: "Cannot add foreign key constraint"

**Causa**: Ordem de criação das tabelas ou tipos incompatíveis.

**Solução**: Execute o schema completo de uma vez (não em partes).

### Erro: "Function already exists"

**Causa**: As funções já foram criadas.

**Solução**: 
- Delete as funções manualmente ou
- Ignore o erro (as funções já existem)

---

## 📝 Notas Importantes

1. **Execute o schema completo de uma vez** - Não execute em partes, pois há dependências entre tabelas.

2. **Ordem de execução**:
   - Primeiro: `schema.sql` (cria tabelas, funções, triggers)
   - Depois: `seed.sql` (insere dados iniciais)

3. **UUIDs**: As tabelas usam `CHAR(36)` para UUIDs. O backend será responsável por gerar os UUIDs.

4. **Triggers**: O trigger `after_user_insert` cria automaticamente o perfil e role quando um usuário é criado.

5. **Funções**: As funções `has_role()` e `user_in_family()` podem ser usadas em queries, mas a autorização principal será feita no backend.

---

## ✅ Checklist

- [ ] Banco `family_finance` criado
- [ ] Schema SQL executado com sucesso
- [ ] 11 tabelas criadas
- [ ] Seed SQL executado (opcional)
- [ ] 16 categorias padrão inseridas (se executou seed)
- [ ] Pronto para desenvolver o backend!

---

**Próximo passo**: Desenvolver o backend API (Node.js + Express) seguindo o `PLANO_DESENVOLVIMENTO.md`.

