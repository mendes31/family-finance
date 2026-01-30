-- Script para verificar e corrigir transações que não têm purchase_date ou due_date
-- Este script verifica inconsistências e sugere correções

-- 1. VERIFICAR transações sem purchase_date e sem due_date
SELECT 
    'Transações sem purchase_date e sem due_date' as tipo,
    COUNT(*) as total,
    GROUP BY type
FROM transactions
WHERE purchase_date IS NULL 
  AND due_date IS NULL
  AND status != 'cancelled'
GROUP BY type;

-- 2. VERIFICAR transações sem purchase_date (mas com due_date)
SELECT 
    'Transações sem purchase_date (mas com due_date)' as tipo,
    COUNT(*) as total,
    type
FROM transactions
WHERE purchase_date IS NULL 
  AND due_date IS NOT NULL
  AND status != 'cancelled'
GROUP BY type;

-- 3. VERIFICAR transações sem due_date (mas com purchase_date)
SELECT 
    'Transações sem due_date (mas com purchase_date)' as tipo,
    COUNT(*) as total,
    type
FROM transactions
WHERE purchase_date IS NOT NULL 
  AND due_date IS NULL
  AND status != 'cancelled'
GROUP BY type;

-- 4. CORRIGIR: Se não tem purchase_date mas tem due_date, usar due_date como purchase_date
UPDATE transactions
SET purchase_date = due_date
WHERE purchase_date IS NULL 
  AND due_date IS NOT NULL
  AND status != 'cancelled';

-- 5. CORRIGIR: Se não tem due_date mas tem purchase_date, usar purchase_date como due_date
UPDATE transactions
SET due_date = purchase_date
WHERE purchase_date IS NOT NULL 
  AND due_date IS NULL
  AND status != 'cancelled';

-- 6. CORRIGIR: Se não tem nenhum dos dois, usar date como fallback (se existir)
UPDATE transactions
SET purchase_date = date,
    due_date = date
WHERE purchase_date IS NULL 
  AND due_date IS NULL
  AND date IS NOT NULL
  AND status != 'cancelled';

-- 7. VERIFICAR resultado final
SELECT 
    type,
    COUNT(*) as total,
    SUM(CASE WHEN purchase_date IS NULL THEN 1 ELSE 0 END) as sem_purchase_date,
    SUM(CASE WHEN due_date IS NULL THEN 1 ELSE 0 END) as sem_due_date,
    SUM(CASE WHEN purchase_date IS NULL AND due_date IS NULL THEN 1 ELSE 0 END) as sem_ambos
FROM transactions
WHERE status != 'cancelled'
GROUP BY type;




