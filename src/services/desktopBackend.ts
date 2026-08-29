import * as Neutralino from '@neutralinojs/lib';
import { setWorkingBaseUrl } from './api';

let isBackendStarted = false;
let isBackendHealthy = false;
let spawnedProcessId: any = null;
let healthCheckPromise: Promise<boolean> | null = null;

export async function checkBackendHealth(): Promise<boolean> {
  const check = async (url: string) => {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 900);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        return data?.status === 'ok';
      }
      return false;
    } catch {
      return false;
    }
  };

  if (await check('http://localhost:3000/api/health')) {
    setWorkingBaseUrl('http://localhost:3000');
    isBackendHealthy = true;
    return true;
  }

  if (await check('http://127.0.0.1:3000/api/health')) {
    setWorkingBaseUrl('http://127.0.0.1:3000');
    isBackendHealthy = true;
    return true;
  }

  isBackendHealthy = false;
  return false;
}

export function isDesktopEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window as any).NL_PORT !== undefined ||
    (window as any).Neutralino !== undefined ||
    window.location.protocol === 'file:' ||
    ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.port !== '' &&
      window.location.port !== '3000')
  );
}

export async function ensureDesktopBackend(): Promise<boolean> {
  if (isBackendHealthy) return true;
  if (!isDesktopEnvironment()) return true;

  if (healthCheckPromise) return healthCheckPromise;

  healthCheckPromise = (async () => {
    if (await checkBackendHealth()) {
      return true;
    }
    await initDesktopBackend();

    // Poll for up to 10 seconds
    const start = Date.now();
    while (Date.now() - start < 10000) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkBackendHealth()) {
        window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
        return true;
      }
    }
    return false;
  })();

  const result = await healthCheckPromise;
  healthCheckPromise = null;
  return result;
}

export async function initDesktopBackend() {
  if (isBackendStarted) return;
  isBackendStarted = true;

  if (!isDesktopEnvironment()) return;

  // If already healthy, dispatch event and return
  if (await checkBackendHealth()) {
    console.log('[Desktop] Backend is already running on port 3000.');
    window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
    return;
  }

  console.log('[Desktop] Backend not running on port 3000. Launching local audio/discord engine...');

  const nlPath = (window as any).NL_PATH || '.';
  const sanitizedNlPath = nlPath.replace(/\\/g, '/');

  const commands = [
    `"${nlPath}\\node.exe" "${nlPath}\\dist\\server.cjs"`,
    `"${sanitizedNlPath}/node.exe" "${sanitizedNlPath}/dist/server.cjs"`,
    `cmd /c "start /b \"\" \"${nlPath}\\node.exe\" \"${nlPath}\\dist\\server.cjs\""`,
    `cmd /c "start /b \"\" node \"${nlPath}\\dist\\server.cjs\""`,
    `cmd /c "start /b \"\" node.exe dist/server.cjs"`,
    `.\\node.exe dist/server.cjs`,
    `node.exe dist/server.cjs`,
    `node dist/server.cjs`,
    `"C:\\Program Files\\nodejs\\node.exe" dist/server.cjs`,
    `"C:\\Program Files (x86)\\nodejs\\node.exe" dist/server.cjs`
  ];

  for (const cmd of commands) {
    try {
      if (typeof Neutralino !== 'undefined' && Neutralino.os) {
        if (Neutralino.os.spawnProcess) {
          const proc = await Neutralino.os.spawnProcess(cmd).catch(() => null);
          if (proc) {
            spawnedProcessId = proc;
            console.log('[Desktop] Spawned backend via spawnProcess:', cmd);
          }
        }
        if (Neutralino.os.execCommand) {
          Neutralino.os.execCommand(cmd, { background: true }).catch(() => null);
          console.log('[Desktop] Spawned backend via execCommand:', cmd);
        }
      }
    } catch (e) {
      // Continue to next command
    }

    // Wait and check if server came online
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkBackendHealth()) {
        console.log('[Desktop] Local backend connected and verified on port 3000!');
        window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
        return;
      }
    }
  }

  // Long poll fallback
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 600));
    if (await checkBackendHealth()) {
      console.log('[Desktop] Backend is now ready!');
      window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
      return;
    }
  }

  console.warn('[Desktop] Finished spawn attempts. If not connected, manual start may be required.');
}

// Clean up when desktop window closes
try {
  if (typeof Neutralino !== 'undefined' && Neutralino.events?.on) {
    Neutralino.events.on('windowClose', async () => {
      try {
        if (spawnedProcessId && Neutralino.os?.updateSpawnedProcess) {
          await Neutralino.os.updateSpawnedProcess(spawnedProcessId.id, 'exit').catch(() => null);
        }
      } catch {}
      try {
        await Neutralino.app.exit();
      } catch {}
    });
  }
} catch {}
