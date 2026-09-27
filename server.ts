import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import routes from './server/routes.js';
import { UPLOADS_DIR, MUSIC_DIR, AMBIENCE_DIR, SFX_DIR, NPCS_DIR } from './server/db.js';
import { discordBot } from './server/discordBot.js';

// Load .env or config.env if present
dotenv.config();
if (fs.existsSync(path.join(process.cwd(), 'config.env'))) {
  dotenv.config({ path: path.join(process.cwd(), 'config.env') });
}

let isShuttingDown = false;
let activeServer: http.Server | null = null;

async function cleanExit(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[i] Sinal ${signal} recebido. Encerrando servidor e liberando conexões...`);

  try {
    await discordBot.stop();
  } catch (err) {
    console.error('Erro ao parar bot no encerramento:', err);
  }

  if (process.platform === 'win32') {
    try {
      const { execSync } = await import('child_process');
      execSync('taskkill /F /IM ffmpeg.exe >nul 2>&1', { stdio: 'ignore' });
    } catch {}
  }

  if (activeServer) {
    activeServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => cleanExit('SIGINT'));
process.on('SIGTERM', () => cleanExit('SIGTERM'));
process.on('SIGHUP', () => cleanExit('SIGHUP'));
if (process.platform === 'win32') {
  process.on('SIGBREAK' as any, () => cleanExit('SIGBREAK'));
}

async function startServer() {
  const app = express();
  const PORT = 3000;


  // CORS middleware for Desktop .exe (Neutralino), Electron & Local Web Clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range, *');
    res.header('Access-Control-Allow-Private-Network', 'true');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // JSON & URL-encoded parsers
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Static media directories for local files
  app.use('/media/uploads', express.static(UPLOADS_DIR));
  app.use('/media/music', express.static(MUSIC_DIR));
  app.use('/media/ambience', express.static(AMBIENCE_DIR));
  app.use('/media/sfx', express.static(SFX_DIR));
  app.use('/media/npcs', express.static(NPCS_DIR));

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API router
  app.use('/api', routes);

  // Determine if running in compiled production bundle or dev mode
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean((typeof __filename !== 'undefined' && __filename.endsWith('.cjs'))) ||
    (!fs.existsSync(path.join(process.cwd(), 'src', 'App.tsx')) && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          watch: {
            ignored: [
              '**/data/**',
              '**/dist-portable/**',
              '**/bin/**',
              '**/.tmp/**',
              '**/resources.neu',
              '**/data/db.json'
            ]
          }
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite dev middleware failed, falling back to static files:', viteErr);
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const server = http.createServer(app);
  activeServer = server;

  server.on('error', async (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[!] Porta ${PORT} já está ocupada. Solicitando liberação de instância anterior...`);
      try {
        const req = http.request({ hostname: '127.0.0.1', port: PORT, path: '/api/system/shutdown', method: 'POST', timeout: 800 });
        req.on('error', () => {});
        req.end();
      } catch {}

      setTimeout(() => {
        server.listen(PORT, '0.0.0.0', () => {
          console.log(`🏰 RPG Bot & Escudo do Mestre rodando em http://0.0.0.0:${PORT}`);
        });
      }, 1200);
    } else {
      console.error('Erro no servidor HTTP:', err);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 RPG Bot & Escudo do Mestre rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
