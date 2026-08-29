import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Neutralino from '@neutralinojs/lib';
import App from './App.tsx';
import './index.css';
import { initDesktopBackend } from './services/desktopBackend';

// Initialize Neutralino and auto-start backend if running in desktop mode
try {
  Neutralino.init();
  initDesktopBackend();
} catch (e) {
  // Running in standard browser / web mode
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

