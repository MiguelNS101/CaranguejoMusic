@echo off
title CaranguejoRPG
cd /d "%~dp0"

echo ========================================================
echo       CARANGUEJO RPG - INICIANDO APLICATIVO
echo ========================================================
echo.

echo [i] Iniciando servidor do bot e motor de som local...
if exist "%~dp0node.exe" (
    start "CaranguejoRPG-Server" /b "%~dp0node.exe" "%~dp0dist\server.cjs"
) else (
    start "CaranguejoRPG-Server" /b node "%~dp0dist\server.cjs"
)

timeout /t 2 /nobreak > nul

if exist "%~dp0CaranguejoRPG.exe" (
    echo [i] Abrindo CaranguejoRPG.exe...
    start "" "%~dp0CaranguejoRPG.exe"
) else if exist "%~dp0CaranguejoRPG-win_x64.exe" (
    echo [i] Abrindo CaranguejoRPG-win_x64.exe...
    start "" "%~dp0CaranguejoRPG-win_x64.exe"
) else (
    echo [i] Abrindo no seu navegador...
    start http://localhost:3000
)

echo [OK] Aplicativo em execucao! Pode minimizar esta janela.
