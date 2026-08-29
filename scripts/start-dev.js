import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const rootDir = process.cwd();

console.log('========================================================');
console.log('        🦀  CARANGUEJO RPG - INICIALIZADOR  🦀');
console.log('========================================================\n');

// 1. Check if node_modules exists
const expressPath = path.join(rootDir, 'node_modules', 'express');
const vitePath = path.join(rootDir, 'node_modules', 'vite');

if (!fs.existsSync(expressPath) || !fs.existsSync(vitePath)) {
  console.log('[i] Instalando bibliotecas e dependências (Áudio, Discord.js, Interface)...');
  console.log('    (Isso ocorre apenas uma vez na primeira execução)');
  console.log('    Aguarde alguns instantes...');
  try {
    execSync('npm install --legacy-peer-deps --no-audit --no-fund', { stdio: 'inherit', cwd: rootDir });
  } catch {
    console.log('[!] Tentando instalação com --force...');
    try {
      execSync('npm install --force --no-audit --no-fund', { stdio: 'inherit', cwd: rootDir });
    } catch (e) {
      console.error('[✗] Erro na instalação de pacotes:', e?.message);
    }
  }
  console.log('\n[✓] Dependências configuradas com sucesso!\n');
}

// 2. Open browser once the server is verified ready
function pollAndOpenBrowser() {
  const url = 'http://localhost:3000';
  let attempts = 0;
  const maxAttempts = 30;

  const check = () => {
    attempts++;
    const req = http.get(`${url}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`\n[✓] Servidor online! Abrindo interface em ${url}...\n`);
        const openCmd = process.platform === 'win32'
          ? `cmd /c start ${url}`
          : process.platform === 'darwin'
            ? `open ${url}`
            : `xdg-open ${url}`;
        try { execSync(openCmd); } catch {}
      } else if (attempts < maxAttempts) {
        setTimeout(check, 500);
      }
    });

    req.on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(check, 500);
      } else {
        // Fallback open anyway
        const openCmd = process.platform === 'win32' ? `cmd /c start ${url}` : `open ${url}`;
        try { execSync(openCmd); } catch {}
      }
    });
  };

  setTimeout(check, 1000);
}

pollAndOpenBrowser();

// 3. Start server process
console.log('[i] Iniciando motor do CaranguejoRPG na porta 3000...');
console.log('\n========================================================');
console.log('  Mantenha esta janela aberta enquanto joga!');
console.log('  Para encerrar o CaranguejoRPG, basta fechar esta janela.');
console.log('========================================================\n');

try {
  // Check if tsx is in node_modules/.bin or local
  const tsxBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  if (fs.existsSync(tsxBin)) {
    execSync(`"${tsxBin}" server.ts`, { stdio: 'inherit', cwd: rootDir });
  } else {
    execSync('npx tsx server.ts', { stdio: 'inherit', cwd: rootDir });
  }
} catch (err) {
  console.log('\n[i] Aplicação encerrada.');
}
