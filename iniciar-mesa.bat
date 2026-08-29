@echo off
chcp 65001 > nul
title CaranguejoRPG - Launcher da Mesa
cd /d "%~dp0"

echo ========================================================
echo        🦀  CARANGUEJO RPG - INICIALIZADOR  🦀
echo ========================================================
echo.

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

node scripts/start-dev.js

echo.
echo Pressione qualquer tecla para encerrar...
pause > nul
