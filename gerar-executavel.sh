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

echo ""
echo "[3/4] Construindo binários do Neutralino.js..."
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
