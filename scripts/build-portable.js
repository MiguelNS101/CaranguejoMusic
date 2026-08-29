import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';

const rootDir = process.cwd();
const distPortableDir = path.join(rootDir, 'dist-portable');

function log(msg) {
  console.log(`\x1b[36m[CaranguejoRPG]\x1b[0m ${msg}`);
}

function logSuccess(msg) {
  console.log(`\x1b[32m[✓]\x1b[0m ${msg}`);
}

function logWarn(msg) {
  console.log(`\x1b[33m[!]\x1b[0m ${msg}`);
}

function logError(msg) {
  console.error(`\x1b[31m[✗]\x1b[0m ${msg}`);
}

function runCmd(cmd, ignoreError = false) {
  try {
    console.log(`\n\x1b[90m> ${cmd}\x1b[0m`);
    execSync(cmd, { stdio: 'inherit', cwd: rootDir });
    return true;
  } catch (err) {
    if (!ignoreError) {
      logError(`Erro ao executar comando: ${cmd}`);
      if (err && err.message) console.error(err.message);
    }
    return false;
  }
}

function copyFolderRecursive(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const srcPath = path.join(source, file);
    const dstPath = path.join(target, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyFolderRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

async function downloadNodeExecutable(destDir) {
  const destPath = path.join(destDir, 'node.exe');
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 20000000) {
    logSuccess('Executável autônomo node.exe já presente na pasta portátil.');
    return;
  }

  log('Baixando executável autônomo node.exe (Windows x64) para rodar o bot sem precisar instalar Node no PC...');
  await new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    https.get('https://nodejs.org/dist/v20.18.0/win-x64/node.exe', (res) => {
      if (res.statusCode !== 200) {
        logWarn(`Aviso ao baixar node.exe: status ${res.statusCode}`);
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        return resolve();
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        logSuccess('node.exe empacotado com sucesso na pasta portátil!');
        resolve();
      });
    }).on('error', (err) => {
      logWarn(`Não foi possível baixar node.exe automaticamente: ${err.message}`);
      file.close();
      try { fs.unlinkSync(destPath); } catch {}
      resolve();
    });
  });
}

async function main() {
  console.log('========================================================');
  console.log('       🦀  CARANGUEJO RPG - GERADOR PORTABLE (.EXE)  🦀');
  console.log('========================================================\n');

  // 1. Install dependencies
  log('Passo [1/5]: Verificando dependências necessárias...');
  const installSuccess = runCmd('npm install --legacy-peer-deps --no-audit --no-fund', true);
  if (!installSuccess) {
    logWarn('Tentando instalação alternativa com --force...');
    runCmd('npm install --force --no-audit --no-fund');
  }
  logSuccess('Dependências prontas!');

  // 2. Build Vite + Backend
  log('Passo [2/5]: Compilando interface React e servidor Express/Discord...');
  const buildSuccess = runCmd('npm run build');
  if (!buildSuccess || !fs.existsSync(path.join(rootDir, 'dist', 'index.html'))) {
    logError('Falha ao compilar o projeto com "npm run build".');
    process.exit(1);
  }
  logSuccess('Frontend e Backend compilados com sucesso!');

  // Ensure folders
  const dirs = [
    'assets',
    'public',
    'resources',
    'resources/icons',
    'resources/js',
    'extensions',
    'dist'
  ];
  for (const d of dirs) {
    const fullPath = path.join(rootDir, d);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
  }

  // Copy icons
  const iconSrc = path.join(rootDir, 'public', 'icon.png');
  const iconAssets = path.join(rootDir, 'assets', 'icon.png');
  const iconNeu = path.join(rootDir, 'resources', 'icons', 'appIcon.png');
  if (fs.existsSync(iconSrc)) {
    if (!fs.existsSync(iconAssets)) fs.copyFileSync(iconSrc, iconAssets);
    if (!fs.existsSync(iconNeu)) fs.copyFileSync(iconSrc, iconNeu);
  }

  // Clean old .tmp if left over from failed builds
  const tmpDir = path.join(rootDir, '.tmp');
  if (fs.existsSync(tmpDir)) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  // 3. Neutralino Build
  log('Passo [3/5]: Empacotando executável para Windows com Neutralino...');
  runCmd('npx --yes @neutralinojs/neu update', true);

  // Ensure neutralino.js is present in resources and dist
  const neuClientLib = path.join(rootDir, 'node_modules', '@neutralinojs', 'lib', 'dist', 'neutralino.js');
  if (fs.existsSync(neuClientLib)) {
    fs.copyFileSync(neuClientLib, path.join(rootDir, 'resources', 'js', 'neutralino.js'));
    fs.copyFileSync(neuClientLib, path.join(rootDir, 'dist', 'neutralino.js'));
  }

  runCmd('npx --yes @neutralinojs/neu build --release', true);

  // 4. Create dist-portable
  log('Passo [4/5]: Estruturando a pasta portátil em "dist-portable/"...');
  if (!fs.existsSync(distPortableDir)) {
    fs.mkdirSync(distPortableDir, { recursive: true });
  }

  const portableSubdirs = ['dist', 'data', 'data/music', 'data/sfx', 'data/npcs', 'data/saves'];
  for (const sub of portableSubdirs) {
    const p = path.join(distPortableDir, sub);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  // Copy Neutralino binaries and resources
  const neuDist = path.join(rootDir, 'dist', 'CaranguejoRPG');
  if (fs.existsSync(neuDist)) {
    copyFolderRecursive(neuDist, distPortableDir);
  }
  const binDir = path.join(rootDir, 'bin');
  if (fs.existsSync(binDir)) {
    copyFolderRecursive(binDir, distPortableDir);
  }

  // Ensure both CaranguejoRPG.exe and CaranguejoRPG-win_x64.exe exist in dist-portable
  const exeWin64 = path.join(distPortableDir, 'CaranguejoRPG-win_x64.exe');
  const exePlain = path.join(distPortableDir, 'CaranguejoRPG.exe');
  if (fs.existsSync(exeWin64)) {
    fs.copyFileSync(exeWin64, exePlain);
  } else if (fs.existsSync(exePlain)) {
    fs.copyFileSync(exePlain, exeWin64);
  }

  // Copy dist build files
  const serverCjs = path.join(rootDir, 'dist', 'server.cjs');
  if (fs.existsSync(serverCjs)) {
    fs.copyFileSync(serverCjs, path.join(distPortableDir, 'dist', 'server.cjs'));
  }
  const indexHtml = path.join(rootDir, 'dist', 'index.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, path.join(distPortableDir, 'dist', 'index.html'));
  }
  const assetsDist = path.join(rootDir, 'dist', 'assets');
  if (fs.existsSync(assetsDist)) {
    copyFolderRecursive(assetsDist, path.join(distPortableDir, 'dist', 'assets'));
  }

  // Copy neutralino.config.json & resources.neu
  const neuConfig = path.join(rootDir, 'neutralino.config.json');
  if (fs.existsSync(neuConfig)) {
    fs.copyFileSync(neuConfig, path.join(distPortableDir, 'neutralino.config.json'));
  }
  const resNeu = path.join(rootDir, 'resources.neu');
  if (fs.existsSync(resNeu)) {
    fs.copyFileSync(resNeu, path.join(distPortableDir, 'resources.neu'));
  }

  // Copy package.json and .env
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(distPortableDir, 'package.json'));
  const envFile = fs.existsSync(path.join(rootDir, '.env')) ? path.join(rootDir, '.env') : path.join(rootDir, '.env.example');
  if (fs.existsSync(envFile)) {
    fs.copyFileSync(envFile, path.join(distPortableDir, '.env'));
  }

  // Copy node_modules to dist-portable
  log('Copiando dependências e bibliotecas para dist-portable (áudio, ffmpeg, discord)...');
  const nodeModulesSrc = path.join(rootDir, 'node_modules');
  const nodeModulesDst = path.join(distPortableDir, 'node_modules');
  copyFolderRecursive(nodeModulesSrc, nodeModulesDst);

  // 5. Download embedded node.exe
  log('Passo [5/5]: Verificando/Baixando node.exe portátil...');
  await downloadNodeExecutable(distPortableDir);

  // Generate clean ASCII Launcher Batch Script inside dist-portable (with CRLF and strict quoting)
  const launcherBatContent = [
    '@echo off',
    'title CaranguejoRPG',
    'cd /d "%~dp0"',
    '',
    'echo ========================================================',
    'echo       CARANGUEJO RPG - INICIANDO APLICATIVO',
    'echo ========================================================',
    'echo.',
    '',
    'echo [i] Iniciando servidor do bot e motor de som local...',
    'if exist "%~dp0node.exe" (',
    '    start "CaranguejoRPG-Server" /b "%~dp0node.exe" "%~dp0dist\\server.cjs"',
    ') else (',
    '    start "CaranguejoRPG-Server" /b node "%~dp0dist\\server.cjs"',
    ')',
    '',
    'timeout /t 2 /nobreak > nul',
    '',
    'if exist "%~dp0CaranguejoRPG.exe" (',
    '    echo [i] Abrindo CaranguejoRPG.exe...',
    '    start "" "%~dp0CaranguejoRPG.exe"',
    ') else if exist "%~dp0CaranguejoRPG-win_x64.exe" (',
    '    echo [i] Abrindo CaranguejoRPG-win_x64.exe...',
    '    start "" "%~dp0CaranguejoRPG-win_x64.exe"',
    ') else (',
    '    echo [i] Abrindo no seu navegador...',
    '    start http://localhost:3000',
    ')',
    '',
    'echo [OK] Aplicativo em execucao! Pode minimizar esta janela.',
    ''
  ].join('\r\n');

  fs.writeFileSync(path.join(distPortableDir, 'Iniciar-CaranguejoRPG.bat'), launcherBatContent, 'utf-8');
  fs.writeFileSync(path.join(distPortableDir, 'CaranguejoRPG.bat'), launcherBatContent, 'utf-8');

  // Create VBS launcher (runs silently without black CMD window)
  const vbsContent = [
    'Set WshShell = CreateObject("WScript.Shell")',
    'WshShell.Run "cmd /c """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\\Iniciar-CaranguejoRPG.bat""", 0, False',
    ''
  ].join('\r\n');
  fs.writeFileSync(path.join(distPortableDir, 'Iniciar-Sem-Janela-Preta.vbs'), vbsContent, 'utf-8');

  console.log('\n========================================================');
  logSuccess('EXECUTÁVEL E PASTA PORTÁTIL GERADOS COM SUCESSO!');
  console.log(`Pasta: ${distPortableDir}`);
  console.log('\nCOMO EXECUTAR:');
  console.log('1. Abra a pasta "dist-portable"');
  console.log('2. Dê 2 cliques direto em "CaranguejoRPG.exe"');
  console.log('========================================================\n');
}

main().catch((err) => {
  logError('Erro durante o empacotamento:');
  console.error(err);
  process.exit(1);
});
