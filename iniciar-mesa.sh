#!/usr/bin/env bash

echo "========================================================"
echo "       🦀  CARANGUEJO RPG - INICIALIZADOR  🦀"
echo "========================================================"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js não foi encontrado no sistema."
    echo "[i] Por favor, instale o Node.js v18+ a partir de https://nodejs.org/"
    exit 1
fi

echo "[✓] Node.js detectado: $(node -v)"
echo ""

# 2. Check node_modules
if [ ! -d "node_modules" ]; then
    echo "[i] Instalando dependências pela primeira vez..."
    npm install
fi

# 3. Open browser
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

# 4. Start dev server
echo "[i] Iniciando a aplicação..."
npm run dev
