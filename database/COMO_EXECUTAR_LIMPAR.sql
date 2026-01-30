-- ============================================
-- GUIA: Como Executar o Script de Limpeza
-- ============================================

-- MÉTODO 1: VIA PHPMYADMIN (RECOMENDADO)
-- 
-- 1. Abra o navegador e acesse: http://localhost/phpmyadmin
-- 2. Selecione o banco 'family_finance' no menu lateral esquerdo
-- 3. Clique na aba "SQL" no topo da página
-- 4. Abra o arquivo 'limpar_transacoes_e_anexos.sql' em um editor de texto
-- 5. Copie TODO o conteúdo do arquivo e cole na caixa de texto do phpMyAdmin
-- 6. Clique no botão "Executar" ou "Go"
-- 7. Verifique o resultado - deve mostrar "0 registros restantes" para ambas as tabelas
--
-- ✅ PRONTO! Todas as transações e anexos foram removidos.

-- MÉTODO 2: VIA LINHA DE COMANDO MySQL
-- 
-- 1. Abra o PowerShell ou CMD como Administrador
-- 2. Navegue até a pasta do projeto:
--    cd C:\wamp64\www\family_finance
-- 3. Execute o comando:
--    mysql -u root -p family_finance < database/limpar_transacoes_e_anexos.sql
-- 4. Se pedir senha, pressione Enter (senha padrão do WAMP é vazia)
-- 5. Verifique o resultado
--
-- ✅ PRONTO! Todas as transações e anexos foram removidos.

-- MÉTODO 3: VIA CLIENTE MYSQL INTERATIVO
-- 
-- 1. Abra o PowerShell ou CMD
-- 2. Execute: mysql -u root -p
-- 3. Se pedir senha, pressione Enter
-- 4. Execute: USE family_finance;
-- 5. Execute: SOURCE C:/wamp64/www/family_finance/database/limpar_transacoes_e_anexos.sql;
-- 6. Verifique o resultado
--
-- ✅ PRONTO! Todas as transações e anexos foram removidos.

-- ============================================
-- ⚠️ AVISO: Este comando é DESTRUTIVO!
-- ⚠️ Não pode ser desfeito. Faça backup antes!
-- ============================================




