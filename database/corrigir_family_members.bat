@echo off
REM Script para executar correção de family_members no Windows
REM Uso: corrigir_family_members.bat

echo ============================================
echo Correção de Membros da Família
echo ============================================
echo.

REM Solicitar senha do MySQL
set /p MYSQL_PASS="Digite a senha do MySQL (root): "

echo.
echo Executando script SQL...
echo.

REM Executar script SQL
mysql -u root -p%MYSQL_PASS% family_finance < database\corrigir_family_members.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Script executado com sucesso!
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Erro ao executar script!
    echo Verifique a senha e a conexão com o MySQL.
    echo ============================================
)

pause


