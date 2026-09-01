@echo off
chcp 65001 > nul
title CaranguejoRPG - Inicializador da Mesa
cd /d "%~dp0"

echo ========================================================
echo        🦀  CARANGUEJO RPG - INICIALIZADOR  🦀
echo ========================================================
echo.

set "NODE_CMD=node"
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%~dp0dist-portable\node.exe" (
        set "NODE_CMD=%~dp0dist-portable\node.exe"
        echo [OK] Utilizando motor Node.js portátil embutido...
    ) else if exist "%~dp0node.exe" (
        set "NODE_CMD=%~dp0node.exe"
        echo [OK] Utilizando motor Node.js portátil embutido...
    ) else (
        echo [!] Node.js não foi encontrado no seu computador.
        echo.
        echo Para rodar o CaranguejoRPG a partir do código-fonte do GitHub:
        echo 1. Baixe e instale o Node.js LTS em https://nodejs.org/
        echo 2. Execute este arquivo novamente!
        echo.
        echo Pressione qualquer tecla para abrir a página de download do Node.js...
        pause > nul
        start https://nodejs.org/
        exit /b 1
    )
)

%NODE_CMD% scripts/start-dev.js

:: Garantir encerramento mútuo do executável e servidor
taskkill /F /IM CaranguejoRPG.exe >nul 2>&1
taskkill /F /IM CaranguejoRPG-win_x64.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq CaranguejoRPG-Server*" >nul 2>&1

echo.
echo Aplicação finalizada. Pressione qualquer tecla para encerrar...
pause > nul
