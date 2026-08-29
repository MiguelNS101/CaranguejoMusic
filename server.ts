import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import routes from './server/routes.js';
import { UPLOADS_DIR, MUSIC_DIR, SFX_DIR, NPCS_DIR } from './server/db.js';

// Load .env or config.env if present
dotenv.config();
if (fs.existsSync(path.join(process.cwd(), 'config.env'))) {
  dotenv.config({ path: path.join(process.cwd(), 'config.env') });
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
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static media directories for local files
  app.use('/media/uploads', express.static(UPLOADS_DIR));
  app.use('/media/music', express.static(MUSIC_DIR));
  app.use('/media/sfx', express.static(SFX_DIR));
  app.use('/media/npcs', express.static(NPCS_DIR));

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API router
  app.use('/api', routes);

  // Vite middleware for dev / static in production
  if (process.env.NODE_ENV !== 'production') {
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
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏰 RPG Bot & Escudo do Mestre rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
