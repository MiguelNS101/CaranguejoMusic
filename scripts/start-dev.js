import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

console.log('========================================================');
console.log('        🦀  CARANGUEJO RPG - INICIALIZADOR  🦀');
console.log('========================================================\n');

// 1. Check if node_modules or vite exists
const vitePath = path.join(rootDir, 'node_modules', 'vite');
if (!fs.existsSync(vitePath)) {
  console.log('[i] Instalando dependências necessárias (Áudio Opus, Discord.js, Interface)...');
  console.log('    (Isso ocorre apenas na primeira inicialização)');
  try {
    execSync('npm install --legacy-peer-deps --no-audit --no-fund', { stdio: 'inherit', cwd: rootDir });
  } catch {
    console.log('[!] Tentando com --force...');
    execSync('npm install --force --no-audit --no-fund', { stdio: 'inherit', cwd: rootDir });
  }
  console.log('[✓] Dependências configuradas com sucesso!\n');
}

// 2. Open browser automatically
console.log('[i] Abrindo o painel do Mestre no seu navegador...');
const openCommand = process.platform === 'win32' ? 'start http://localhost:3000' :
                    process.platform === 'darwin' ? 'open http://localhost:3000' : 'xdg-open http://localhost:3000';

setTimeout(() => {
  try {
    if (process.platform === 'win32') {
      execSync('cmd /c "start http://localhost:3000"');
    } else {
      execSync(openCommand);
    }
  } catch {}
}, 1500);

// 3. Start server
console.log('[i] Iniciando o servidor Master Screen na porta 3000...');
console.log('\n========================================================');
console.log('  O painel está ativo! Mantenha esta janela aberta.');
console.log('  Para fechar a aplicação, feche esta janela.');
console.log('========================================================\n');

try {
  execSync('npx tsx server.ts', { stdio: 'inherit', cwd: rootDir });
} catch (err) {
  console.log('\n[!] O servidor foi encerrado.');
}
