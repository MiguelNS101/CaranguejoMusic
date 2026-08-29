import * as Neutralino from '@neutralinojs/lib';
import { setWorkingBaseUrl } from './api';

let isBackendStarted = false;
let spawnedProcessId: any = null;

export async function checkBackendHealth(): Promise<boolean> {
  const check = async (url: string) => {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 700);
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
    return true;
  }

  if (await check('http://127.0.0.1:3000/api/health')) {
    setWorkingBaseUrl('http://127.0.0.1:3000');
    return true;
  }

  return false;
}

export async function initDesktopBackend() {
  if (isBackendStarted) return;
  isBackendStarted = true;

  // Check if we are in Neutralino / Desktop mode
  const isDesktop =
    typeof window !== 'undefined' &&
    ((window as any).NL_PORT !== undefined ||
      (window as any).Neutralino !== undefined ||
      window.location.protocol === 'file:' ||
      ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        window.location.port !== '3000'));

  if (!isDesktop) return;

  // If already healthy, nothing more to do
  if (await checkBackendHealth()) {
    console.log('[Desktop] Backend is already running and healthy.');
    return;
  }

  console.log('[Desktop] Backend is not reachable. Attempting auto-spawn...');

  const commands = [
    '.\\node.exe dist/server.cjs',
    'node.exe dist/server.cjs',
    'node dist/server.cjs',
    '"C:\\Program Files\\nodejs\\node.exe" dist/server.cjs',
    '"C:\\Program Files (x86)\\nodejs\\node.exe" dist/server.cjs',
    'start /b node dist/server.cjs'
  ];

  for (const cmd of commands) {
    try {
      if (typeof Neutralino !== 'undefined' && Neutralino.os) {
        if (Neutralino.os.spawnProcess) {
          const proc = await Neutralino.os.spawnProcess(cmd).catch(() => null);
          if (proc) {
            spawnedProcessId = proc;
            console.log('[Desktop] Spawned process with command:', cmd, proc);
          }
        } else if (Neutralino.os.execCommand) {
          Neutralino.os.execCommand(cmd, { background: true }).catch(() => null);
          console.log('[Desktop] Executed background command:', cmd);
        }
      }
    } catch (e) {
      // Try next command
    }

    // Wait a brief moment and test if server came up
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 600));
      if (await checkBackendHealth()) {
        console.log('[Desktop] Backend connected successfully!');
        return;
      }
    }
  }

  console.warn('[Desktop] Auto-spawn finished all attempts.');
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
