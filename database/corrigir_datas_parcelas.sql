-- Script para corrigir as datas de lançamento (date) das parcelas
-- baseado na data de vencimento (due_date)
-- A data de lançamento deve ser o primeiro dia do mês do vencimento

-- Atualizar todas as parcelas de cartão de crédito
-- onde a data de lançamento não corresponde ao primeiro dia do mês do vencimento
UPDATE transactions t
SET date = DATE_FORMAT(due_date, '%Y-%m-01')
WHERE t.is_installment = 1
  AND t.payment_method = 'credit_card'
  AND t.due_date IS NOT NULL
  AND t.date != DATE_FORMAT(t.due_date, '%Y-%m-01')
  AND t.status != 'cancelled';

-- Verificar o resultado
SELECT 
    id,
    description,
    date as data_lancamento_atual,
    due_date as data_vencimento,
    DATE_FORMAT(due_date, '%Y-%m-01') as data_lancamento_corrigida,
    CASE 
        WHEN date = DATE_FORMAT(due_date, '%Y-%m-01') THEN 'OK'
        ELSE 'PRECISA CORRIGIR'
    END as status
FROM transactions
WHERE is_installment = 1
  AND payment_method = 'credit_card'
  AND due_date IS NOT NULL
ORDER BY due_date;




