@echo off
chcp 65001 > nul
title CaranguejoRPG - Launcher Automatico

echo ========================================================
echo        🦀  CARANGUEJO RPG - INICIALIZADOR  🦀
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

:: 2. Instalar ou reparar dependencias se nao existirem
set NEED_INSTALL=0
if not exist "node_modules\" set NEED_INSTALL=1
if not exist "node_modules\vite\" set NEED_INSTALL=1
if not exist "node_modules\tsx\" set NEED_INSTALL=1

if %NEED_INSTALL%==1 (
    echo [i] Instalando dependencias necessarias (Audio Opus, Discord.js, Interface)...
    echo     (Isso so acontece na primeira inicializacao)
    call npm install --legacy-peer-deps --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo [!] Tentando instalacao alternativa com --force...
        call npm install --force --no-audit --no-fund
    )
    echo [✓] Dependencias e motores de audio configurados com sucesso!
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
if %errorlevel% neq 0 (
    echo.
    echo [!] O servidor foi finalizado ou encontrou um erro.
    echo     Se uma porta estiver ocupada, feche outros servidores Node ou reinicie a maquina.
    echo.
)
pause
