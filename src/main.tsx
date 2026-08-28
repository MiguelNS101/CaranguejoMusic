import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Neutralino from '@neutralinojs/lib';
import App from './App.tsx';
import './index.css';

// Initialize Neutralino if running as desktop app
try {
  Neutralino.init();
} catch (e) {
  // Running in standard browser / web mode
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

