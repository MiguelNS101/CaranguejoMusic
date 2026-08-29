@echo off
chcp 65001 > nul
title CaranguejoRPG - Escudo do Mestre
cd /d "%~dp0"

echo ========================================================
echo       🦀  CARANGUEJO RPG - INICIANDO APLICATIVO  🦀
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] O Node.js nao foi detectado no PATH do Windows.
    echo Certifique-se de ter o Node.js v18+ instalado (https://nodejs.org).
    echo.
)

echo [i] Iniciando servidor do bot e motor de som local na porta 3000...
start "CaranguejoRPG Server" /b node dist/server.cjs

timeout /t 2 /nobreak > nul

if exist "CaranguejoRPG-win_x64.exe" (
    echo [i] Abrindo janela desktop do CaranguejoRPG...
    start "" CaranguejoRPG-win_x64.exe
) else if exist "CaranguejoRPG.exe" (
    echo [i] Abrindo janela desktop do CaranguejoRPG...
    start "" CaranguejoRPG.exe
) else if exist "neutralino-win_x64.exe" (
    echo [i] Abrindo janela desktop do CaranguejoRPG...
    start "" neutralino-win_x64.exe
) else (
    echo [i] Abrindo no seu navegador padrao...
    start http://localhost:3000
)

echo.
echo [✓] Aplicativo em execucao! Pode minimizar esta janela.
