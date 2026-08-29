import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Neutralino from '@neutralinojs/lib';
import App from './App.tsx';
import './index.css';

// Initialize Neutralino if running as desktop app
try {
  Neutralino.init();

  // If in desktop app, ensure backend is running or auto-spawn it
  fetch('http://localhost:3000/api/health')
    .then(r => r.json())
    .catch(() => {
      // Backend not yet reachable on 3000, attempt to auto-launch local node server
      try {
        if (Neutralino.os?.execCommand) {
          Neutralino.os.execCommand('node dist/server.cjs', { background: true }).catch(() => {});
        }
      } catch (err) {
        console.warn('Could not auto-start backend via Neutralino:', err);
      }
    });

  // Ensure app exits cleanly when window is closed
  if (Neutralino.events?.on) {
    Neutralino.events.on('windowClose', () => {
      try {
        Neutralino.app.exit();
      } catch {}
    });
  }
} catch (e) {
  // Running in standard browser / web mode
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

