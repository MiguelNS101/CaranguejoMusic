@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
title CaranguejoRPG - Gerador de Executavel Portable

echo ========================================================
echo       🦀  CARANGUEJO RPG - GERADOR PORTABLE (.EXE)  🦀
echo ========================================================
echo.

:: 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js nao foi encontrado no sistema.
    echo     Instale o Node.js LTS em https://nodejs.org/ e tente novamente.
    echo.
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias necessarias (Audio Opus, Discord.js, Interface)...
cmd /c "npm install --legacy-peer-deps --no-audit --no-fund"
if %errorlevel% neq 0 (
    echo [!] Tentando instalacao alternativa com --force...
    cmd /c "npm install --force --no-audit --no-fund"
)

:: Verificar se o vite foi instalado
if not exist "node_modules\vite\" (
    echo.
    echo [!] Erro critico: dependencias principais nao foram instaladas.
    echo     Verifique sua conexao com a internet ou permissoes de pasta.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Compilando interface React e servidor Express/Discord...
cmd /c "npm run build"
if %errorlevel% neq 0 (
    echo.
    echo [!] Erro durante a compilacao (npm run build).
    echo.
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo.
    echo [!] Erro: O arquivo dist\index.html nao foi gerado na compilacao.
    echo.
    pause
    exit /b 1
)

:: Garantir estrutura de resources, icons e neutralino.js
if not exist "assets\" mkdir "assets"
if not exist "public\" mkdir "public"
if not exist "resources\" mkdir "resources"
if not exist "resources\icons\" mkdir "resources\icons"
if not exist "resources\js\" mkdir "resources\js"
if not exist "extensions\" mkdir "extensions"
if not exist "dist\" mkdir "dist"

:: Copiar icone se necessario
if not exist "assets\icon.png" (
    if exist "public\icon.png" copy /Y "public\icon.png" "assets\icon.png" >nul
)
if not exist "resources\icons\appIcon.png" (
    if exist "assets\icon.png" copy /Y "assets\icon.png" "resources\icons\appIcon.png" >nul
)

if exist "node_modules\@neutralinojs\lib\dist\neutralino.js" (
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "resources\js\neutralino.js" >nul
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "dist\neutralino.js" >nul
) else (
    echo. > "resources\js\neutralino.js"
)

echo.
echo [3/4] Baixando binarios e empacotando com Neutralino.js...
cmd /c "npx --yes @neutralinojs/neu update"

if exist "node_modules\@neutralinojs\lib\dist\neutralino.js" (
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "resources\js\neutralino.js" >nul
    copy /Y "node_modules\@neutralinojs\lib\dist\neutralino.js" "dist\neutralino.js" >nul
)

cmd /c "npx --yes @neutralinojs/neu build --release"
if %errorlevel% neq 0 (
    echo [!] Aviso no neu build, tentando comando neu padrao...
    if exist "node_modules\.bin\neu.cmd" (
        cmd /c "node_modules\.bin\neu.cmd build --release"
    )
)

echo.
echo [4/4] Montando pasta portatil pronta para uso em 'dist-portable\'...
if not exist "dist-portable\" mkdir "dist-portable"
if not exist "dist-portable\dist\" mkdir "dist-portable\dist"
if not exist "dist-portable\data\" mkdir "dist-portable\data"
if not exist "dist-portable\data\music\" mkdir "dist-portable\data\music"
if not exist "dist-portable\data\sfx\" mkdir "dist-portable\data\sfx"
if not exist "dist-portable\data\npcs\" mkdir "dist-portable\data\npcs"
if not exist "dist-portable\data\saves\" mkdir "dist-portable\data\saves"

:: Copiar arquivos compilados do Neutralino
if exist "dist\CaranguejoRPG\" (
    xcopy /E /I /Y "dist\CaranguejoRPG\*" "dist-portable\" >nul
)
if exist "bin\" (
    xcopy /E /I /Y "bin\*" "dist-portable\" >nul
)

:: Copiar servidor, assets e modulos de audio para dist-portable
if exist "dist\server.cjs" copy /Y "dist\server.cjs" "dist-portable\dist\server.cjs" >nul
if exist "dist\index.html" copy /Y "dist\index.html" "dist-portable\dist\index.html" >nul
if exist "dist\assets\" xcopy /E /I /Y "dist\assets\*" "dist-portable\dist\assets\" >nul
if exist "package.json" copy /Y "package.json" "dist-portable\package.json" >nul

:: Copiar node_modules para execucao independente do server
if exist "node_modules\" (
    echo [i] Copiando dependencias e modulos de audio para dist-portable...
    if not exist "dist-portable\node_modules\" mkdir "dist-portable\node_modules"
    xcopy /E /I /Y /Q "node_modules\*" "dist-portable\node_modules\" >nul
)

:: Copiar arquivos de configuracao
if not exist "dist-portable\.env" (
    if exist ".env" (
        copy ".env" "dist-portable\.env" >nul
    ) else (
        copy ".env.example" "dist-portable\.env" >nul
    )
)

:: Criar script de inicializacao rapida dentro da pasta portable
echo @echo off > "dist-portable\CaranguejoRPG.bat"
echo chcp 65001 ^> nul >> "dist-portable\CaranguejoRPG.bat"
echo title CaranguejoRPG - Escudo do Mestre >> "dist-portable\CaranguejoRPG.bat"
echo cd /d "%%~dp0" >> "dist-portable\CaranguejoRPG.bat"
echo start "" /b node dist/server.cjs >> "dist-portable\CaranguejoRPG.bat"
echo timeout /t 2 /nobreak ^> nul >> "dist-portable\CaranguejoRPG.bat"
echo if exist "CaranguejoRPG-win_x64.exe" ( >> "dist-portable\CaranguejoRPG.bat"
echo     start "" CaranguejoRPG-win_x64.exe >> "dist-portable\CaranguejoRPG.bat"
echo ) else if exist "CaranguejoRPG.exe" ( >> "dist-portable\CaranguejoRPG.bat"
echo     start "" CaranguejoRPG.exe >> "dist-portable\CaranguejoRPG.bat"
echo ) else if exist "neutralino-win_x64.exe" ( >> "dist-portable\CaranguejoRPG.bat"
echo     start "" neutralino-win_x64.exe >> "dist-portable\CaranguejoRPG.bat"
echo ) else ( >> "dist-portable\CaranguejoRPG.bat"
echo     start http://localhost:3000 >> "dist-portable\CaranguejoRPG.bat"
echo ) >> "dist-portable\CaranguejoRPG.bat"

echo.
echo ========================================================
echo  [✓] SUCESSO! A pasta portable foi gerada em:
echo      %CD%\dist-portable
echo.
echo  COMO USAR:
echo  1. Abra a pasta 'dist-portable\'
echo  2. Edite o arquivo '.env' se quiser configurar seu Bot
echo  3. Execute 'CaranguejoRPG.bat' ou 'CaranguejoRPG-win_x64.exe'
echo ========================================================
echo.
pause
