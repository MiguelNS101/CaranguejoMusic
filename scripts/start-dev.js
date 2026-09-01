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

let serverChild = null;
let appChild = null;
let isExiting = false;

function cleanupAndExit() {
  if (isExiting) return;
  isExiting = true;
  console.log('\n[i] Sincronizando encerramento: fechando servidor e executável...');
  
  if (appChild && !appChild.killed) {
    try { appChild.kill(); } catch {}
  }
  if (serverChild && !serverChild.killed) {
    try { serverChild.kill(); } catch {}
  }

  if (process.platform === 'win32') {
    try {
      execSync('taskkill /F /IM CaranguejoRPG.exe >nul 2>&1', { stdio: 'ignore' });
      execSync('taskkill /F /IM CaranguejoRPG-win_x64.exe >nul 2>&1', { stdio: 'ignore' });
    } catch {}
  }
  
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.on('SIGHUP', cleanupAndExit);
process.on('exit', () => {
  if (!isExiting) cleanupAndExit();
});

// 2. Open browser or executable once the server is verified ready
function pollAndOpenClient() {
  const url = 'http://localhost:3000';
  let attempts = 0;
  const maxAttempts = 30;

  const check = () => {
    attempts++;
    const req = http.get(`${url}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`\n[✓] Servidor online! Abrindo interface do CaranguejoRPG...\n`);
        
        // Check if executable exists in dist-portable or root
        const portableExe = path.join(rootDir, 'dist-portable', 'CaranguejoRPG.exe');
        const rootExe = path.join(rootDir, 'CaranguejoRPG.exe');
        const exeToRun = fs.existsSync(portableExe) ? portableExe : fs.existsSync(rootExe) ? rootExe : null;

        if (exeToRun) {
          console.log(`[i] Iniciando executável ${exeToRun}...`);
          try {
            appChild = spawn(exeToRun, [], { stdio: 'ignore', detached: false });
            appChild.on('exit', () => {
              console.log('\n[i] Janela do aplicativo fechada pelo usuário. Encerrando servidor...');
              cleanupAndExit();
            });
          } catch {
            openBrowserFallback(url);
          }
        } else {
          openBrowserFallback(url);
        }
      } else if (attempts < maxAttempts) {
        setTimeout(check, 500);
      }
    });

    req.on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(check, 500);
      } else {
        openBrowserFallback(url);
      }
    });
  };

  setTimeout(check, 1000);
}

function openBrowserFallback(url) {
  const openCmd = process.platform === 'win32'
    ? `cmd /c start ${url}`
    : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;
  try { execSync(openCmd); } catch {}
}

pollAndOpenClient();

// 3. Start server process
console.log('[i] Iniciando motor do CaranguejoRPG na porta 3000...');
console.log('\n========================================================');
console.log('  Sincronização ativa: ao fechar o app ou esta janela,');
console.log('  o servidor e a interface encerram juntos automaticamente.');
console.log('========================================================\n');

try {
  const tsxBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  const serverCmd = fs.existsSync(tsxBin) ? tsxBin : 'npx';
  const serverArgs = fs.existsSync(tsxBin) ? ['server.ts'] : ['tsx', 'server.ts'];

  serverChild = spawn(serverCmd, serverArgs, { stdio: 'inherit', cwd: rootDir });
  
  serverChild.on('exit', () => {
    cleanupAndExit();
  });
} catch (err) {
  cleanupAndExit();
}
