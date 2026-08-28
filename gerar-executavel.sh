#!/usr/bin/env bash

echo "========================================================"
echo "  ⚔️  MASTER SCREEN RPG - GERADOR PORTABLE (.EXE/APP)  ⚔️"
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

mkdir -p dist resources/js
if [ -f "node_modules/@neutralinojs/lib/dist/neutralino.js" ]; then
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "resources/js/neutralino.js"
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "dist/neutralino.js"
else
    touch resources/js/neutralino.js
fi

echo ""
echo "[3/4] Baixando binários e empacotando com Neutralino.js..."
npx @neutralinojs/neu update --force
if [ -f "node_modules/@neutralinojs/lib/dist/neutralino.js" ]; then
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "resources/js/neutralino.js"
    cp "node_modules/@neutralinojs/lib/dist/neutralino.js" "dist/neutralino.js"
fi
npx @neutralinojs/neu build --release

echo ""
echo "[4/4] Criando pasta portable..."
mkdir -p dist-portable/data/music dist-portable/data/sfx dist-portable/data/npcs dist-portable/data/saves

if [ ! -f "dist-portable/.env" ]; then
    if [ -f ".env" ]; then
        cp .env dist-portable/.env
    else
        cp .env.example dist-portable/.env
    fi
fi

if [ -d "bin" ]; then
    cp -r bin/* dist-portable/
fi

echo ""
echo "========================================================"
echo " [✓] SUCESSO! A pasta portable foi gerada em dist-portable/"
echo "========================================================"
