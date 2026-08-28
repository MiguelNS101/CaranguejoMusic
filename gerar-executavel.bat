@echo off
chcp 65001 > nul
title Master Screen RPG - Gerador de Executavel Portable

echo ========================================================
echo   ⚔️  MASTER SCREEN RPG - GERADOR PORTABLE (.EXE)  ⚔️
echo ========================================================
echo.

:: 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js nao encontrado. Instale em https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias necessarias...
call npm install

echo.
echo [2/4] Compilando interface e servidor Express/Discord...
call npm run build

:: Garantir estrutura de resources e neutralino.js
if not exist "resources\js\" mkdir "resources\js"
if not exist "dist\" mkdir "dist"

if exist "node_modules\@neutralinojs\lib\dist\neutralino.js" (
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "resources\js\neutralino.js" >nul
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "dist\neutralino.js" >nul
) else (
    echo. > "resources\js\neutralino.js"
)

echo.
echo [3/4] Baixando binarios e empacotando com Neutralino.js...
call npx @neutralinojs/neu update --force
if exist "node_modules\@neutralinojs\lib\dist\neutralino.js" (
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "resources\js\neutralino.js" >nul
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "dist\neutralino.js" >nul
)
call npx @neutralinojs/neu build --release

echo.
echo [4/4] Montando pasta portatil pronta para uso em 'dist-portable\'...
if not exist "dist-portable\" mkdir "dist-portable"
if not exist "dist-portable\data\" mkdir "dist-portable\data"
if not exist "dist-portable\data\music\" mkdir "dist-portable\data\music"
if not exist "dist-portable\data\sfx\" mkdir "dist-portable\data\sfx"
if not exist "dist-portable\data\npcs\" mkdir "dist-portable\data\npcs"
if not exist "dist-portable\data\saves\" mkdir "dist-portable\data\saves"

:: Copiar arquivos essenciais
if not exist "dist-portable\.env" (
    if exist ".env" (
        copy ".env" "dist-portable\.env" >nul
    ) else (
        copy ".env.example" "dist-portable\.env" >nul
    )
)

:: Copiar binarios do Neutralino gerados
if exist "bin\" (
    xcopy /E /I /Y "bin\*" "dist-portable\" >nul
)

:: Criar script de inicializacao rapida dentro da pasta portable
echo @echo off > "dist-portable\MasterScreen-RPG.bat"
echo title Master Screen RPG >> "dist-portable\MasterScreen-RPG.bat"
echo if exist "MasterScreen-RPG-win_x64.exe" ( >> "dist-portable\MasterScreen-RPG.bat"
echo     start MasterScreen-RPG-win_x64.exe >> "dist-portable\MasterScreen-RPG.bat"
echo ) else if exist "MasterScreen-RPG.exe" ( >> "dist-portable\MasterScreen-RPG.bat"
echo     start MasterScreen-RPG.exe >> "dist-portable\MasterScreen-RPG.bat"
echo ) else ( >> "dist-portable\MasterScreen-RPG.bat"
echo     start http://localhost:3000 >> "dist-portable\MasterScreen-RPG.bat"
echo     node dist/server.cjs >> "dist-portable\MasterScreen-RPG.bat"
echo ) >> "dist-portable\MasterScreen-RPG.bat"

echo.
echo ========================================================
echo  [✓] SUCESSO! A pasta portable foi gerada em:
echo      %CD%\dist-portable
echo.
echo  COMO USAR:
echo  1. Abra a pasta 'dist-portable\'
echo  2. Edite o arquivo '.env' se quiser configurar seu Bot
echo  3. Execute 'MasterScreen-RPG.exe' (ou 'MasterScreen-RPG.bat')
echo ========================================================
echo.
pause
