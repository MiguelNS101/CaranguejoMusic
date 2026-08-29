@echo off
chcp 65001 > nul
title CaranguejoRPG - Gerador de Executavel Portable
cd /d "%~dp0"

echo ========================================================
echo       🦀  CARANGUEJO RPG - GERADOR PORTABLE (.EXE)  🦀
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js nao foi encontrado no sistema.
    echo     Instale o Node.js LTS em https://nodejs.org/ e tente novamente.
    echo.
    pause
    exit /b 1
)

node scripts/build-portable.js

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
