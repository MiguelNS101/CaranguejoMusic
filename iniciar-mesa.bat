@echo off
chcp 65001 > nul
title Master Screen RPG - Launcher Automatico

echo ========================================================
echo        ⚔️  MASTER SCREEN RPG - INICIALIZADOR  ⚔️
echo ========================================================
echo.

:: 1. Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js nao foi detectado no seu computador.
    echo [i] Abrindo a pagina de download oficial do Node.js LTS...
    start https://nodejs.org/
    echo.
    echo Por favor, instale o Node.js e depois execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js detectado com sucesso!
echo.

:: 2. Instalar dependencias se nao existirem
if not exist "node_modules\" (
    echo [i] Instalando dependencias necessarias pela primeira vez...
    echo     (Isso so acontece na primeira inicializacao)
    call npm install
    if %errorlevel% neq 0 (
        echo [X] Erro ao instalar dependencias. Verifique sua conexao com a internet.
        pause
        exit /b 1
    )
    echo [✓] Dependencias instaladas com sucesso!
    echo.
)

:: 3. Abrir o navegador automaticamente
echo [i] Abrindo a tela do Mestre no seu navegador...
start http://localhost:3000

:: 4. Iniciar o servidor com bot e audio
echo [i] Iniciando o servidor Master Screen na porta 3000...
echo.
echo ========================================================
echo   O painel esta ativo! Mantenha esta janela aberta.
echo   Para fechar a aplicacao, basta fechar esta janela.
echo ========================================================
echo.

call npm run dev
pause
