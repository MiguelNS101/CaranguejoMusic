#!/usr/bin/env bash

echo "========================================================"
echo "  🦀  CARANGUEJO RPG - GERADOR PORTABLE (.EXE/APP)  🦀"
echo "========================================================"
echo ""

# 1. Check Node
if ! command -v node &> /dev/null; then
    echo "[!] Node.js não foi encontrado. Instale em https://nodejs.org/"
    exit 1
fi

echo "[1/4] Instalando dependências..."
npm install

echo ""
echo "[2/4] Compilando frontend e backend..."
npm run build

mkdir -p assets public resources/icons resources/js extensions dist

if [ ! -f "assets/icon.png" ] && [ -f "public/icon.png" ]; then
    cp public/icon.png assets/icon.png
fi
if [ -f "assets/icon.png" ]; then
    cp assets/icon.png resources/icons/appIcon.png
fi

if [ -f "node_modules/@neutralinojs/lib/dist/neutralino.js" ]; then
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "resources/js/neutralino.js"
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "dist/neutralino.js"
else
    touch resources/js/neutralino.js
fi

echo ""
echo "[3/4] Baixando binários e empacotando com Neutralino.js..."
npx @neutralinojs/neu update
if [ -f "node_modules/@neutralinojs/lib/dist/neutralino.js" ]; then
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "resources/js/neutralino.js"
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "dist/neutralino.js"
fi
npx @neutralinojs/neu build --release

echo ""
echo "[4/4] Criando pasta portable..."
mkdir -p dist-portable/dist dist-portable/data/music dist-portable/data/sfx dist-portable/data/npcs dist-portable/data/saves

if [ -d "dist/CaranguejoRPG" ]; then
    cp -r dist/CaranguejoRPG/* dist-portable/
fi
if [ -d "bin" ]; then
    cp -r bin/* dist-portable/
fi

if [ -f "dist/server.cjs" ]; then
    cp dist/server.cjs dist-portable/dist/server.cjs
fi
if [ -f "dist/index.html" ]; then
    cp dist/index.html dist-portable/dist/index.html
fi
if [ -d "dist/assets" ]; then
    cp -r dist/assets dist-portable/dist/
fi

if [ ! -f "dist-portable/.env" ]; then
    if [ -f ".env" ]; then
        cp .env dist-portable/.env
    else
        cp .env.example dist-portable/.env
    fi
fi

echo ""
echo "========================================================"
echo " [✓] SUCESSO! A pasta portable foi gerada em dist-portable/"
echo "========================================================"
