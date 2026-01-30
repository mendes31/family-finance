# Como Verificar e Corrigir Datas das Transações

## Objetivo
Este script verifica e corrige transações que não têm `purchase_date` ou `due_date` preenchidos, garantindo que todas as transações tenham pelo menos uma dessas datas para os filtros funcionarem corretamente.

## Como Executar

### MÉTODO 1: VIA PHPMYADMIN (RECOMENDADO)

1. Abra o navegador e acesse: `http://localhost/phpmyadmin`
2. Selecione o banco `family_finance` no menu lateral esquerdo
3. Clique na aba "SQL" no topo da página
4. Abra o arquivo `verificar_e_corrigir_datas.sql` em um editor de texto
5. **IMPORTANTE**: Execute primeiro apenas as queries de VERIFICAÇÃO (SELECT) para ver o estado atual
6. Se necessário, execute as queries de CORREÇÃO (UPDATE)
7. Execute novamente as queries de VERIFICAÇÃO para confirmar as correções

### MÉTODO 2: VIA LINHA DE COMANDO MySQL

```bash
cd C:\wamp64\www\family_finance
mysql -u root -p family_finance < database/verificar_e_corrigir_datas.sql
```

## O que o script faz?

1. **Verifica** transações sem `purchase_date` e sem `due_date`
2. **Verifica** transações sem `purchase_date` (mas com `due_date`)
3. **Verifica** transações sem `due_date` (mas com `purchase_date`)
4. **Corrige**: Se não tem `purchase_date` mas tem `due_date`, usa `due_date` como `purchase_date`
5. **Corrige**: Se não tem `due_date` mas tem `purchase_date`, usa `purchase_date` como `due_date`
6. **Corrige**: Se não tem nenhum dos dois, usa `date` como fallback (se existir)
7. **Verifica** o resultado final

## ⚠️ IMPORTANTE

- Execute primeiro as queries de **VERIFICAÇÃO** (SELECT) para ver o estado atual
- Revise os resultados antes de executar as queries de **CORREÇÃO** (UPDATE)
- Recomenda-se fazer backup antes de executar
- O script só afeta transações que não estão canceladas (`status != 'cancelled'`)

## Resultado Esperado

Após executar o script, todas as transações devem ter pelo menos `purchase_date` ou `due_date` preenchido, garantindo que os filtros funcionem corretamente.




