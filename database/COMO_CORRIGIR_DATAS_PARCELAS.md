# Como Corrigir as Datas de Lançamento das Parcelas

## Problema
As parcelas de cartão de crédito podem ter a data de lançamento (`date`) incorreta. Este script corrige a data de lançamento para ser o primeiro dia do mês do vencimento (`due_date`).

## Como Executar

### MÉTODO 1: VIA PHPMYADMIN (RECOMENDADO)

1. Abra o navegador e acesse: `http://localhost/phpmyadmin`
2. Selecione o banco `family_finance` no menu lateral esquerdo
3. Clique na aba "SQL" no topo da página
4. Abra o arquivo `corrigir_datas_parcelas.sql` em um editor de texto
5. Copie TODO o conteúdo do arquivo e cole na caixa de texto do phpMyAdmin
6. Clique no botão "Executar" ou "Go"
7. Verifique o resultado - deve mostrar quantas linhas foram atualizadas

### MÉTODO 2: VIA LINHA DE COMANDO MySQL

1. Abra o PowerShell ou CMD
2. Navegue até a pasta do projeto:
   ```bash
   cd C:\wamp64\www\family_finance
   ```
3. Execute o comando:
   ```bash
   mysql -u root -p family_finance < database/corrigir_datas_parcelas.sql
   ```
4. Se pedir senha, pressione Enter (senha padrão do WAMP é vazia)
5. Verifique o resultado

### MÉTODO 3: VIA CLIENTE MYSQL INTERATIVO

1. Abra o PowerShell ou CMD
2. Execute: `mysql -u root -p`
3. Se pedir senha, pressione Enter
4. Execute: `USE family_finance;`
5. Execute: `SOURCE C:/wamp64/www/family_finance/database/corrigir_datas_parcelas.sql;`
6. Verifique o resultado

## O que o script faz?

1. **Atualiza** todas as parcelas de cartão de crédito onde a `date` não corresponde ao primeiro dia do mês do `due_date`
2. **Verifica** o resultado mostrando quais transações foram corrigidas

## Exemplo

Antes:
- Parcela 2: `date: 2025-12-01`, `due_date: 2026-01-10` ❌

Depois:
- Parcela 2: `date: 2026-01-01`, `due_date: 2026-01-10` ✅

## ⚠️ IMPORTANTE

- Este script **NÃO** remove dados, apenas corrige as datas
- Recomenda-se fazer backup antes de executar
- O script só afeta parcelas de cartão de crédito com `due_date` definido




