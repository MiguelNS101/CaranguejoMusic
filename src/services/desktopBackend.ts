import * as Neutralino from '@neutralinojs/lib';
import { setWorkingBaseUrl } from './api';

export interface DesktopLogEntry {
  id: string;
  timestamp: string;
  source: 'desktop' | 'network' | 'process' | 'system';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

const desktopLogs: DesktopLogEntry[] = [];
let isBackendStarting = false;
let isBackendHealthy = false;
let healthCheckPromise: Promise<boolean> | null = null;
let lastHealthCheckTime = 0;
let lastPingLatency = 0;
let neutralinoInitialized = false;

export function addDesktopLog(
  level: 'info' | 'warn' | 'error' | 'success',
  message: string,
  details?: string,
  source: 'desktop' | 'network' | 'process' | 'system' = 'desktop'
) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const entry: DesktopLogEntry = {
    id: `desktop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: timeStr,
    source,
    level,
    message,
    details
  };
  desktopLogs.unshift(entry);
  if (desktopLogs.length > 250) {
    desktopLogs.pop();
  }

  const prefix = `[${timeStr}] [DESKTOP] [${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(`${prefix} ${message}`, details || '');
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`, details || '');
  } else {
    console.log(`${prefix} ${message}`, details || '');
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('desktop-log', { detail: entry }));
  }
}

export function getDesktopLogs(): DesktopLogEntry[] {
  return [...desktopLogs];
}

export function clearDesktopLogs(): void {
  desktopLogs.length = 0;
  addDesktopLog('info', 'Logs do motor desktop limpos.');
}

export function getDesktopStatusInfo() {
  return {
    isDesktop: isDesktopEnvironment(),
    isHealthy: isBackendHealthy,
    lastPingLatency,
    lastHealthCheckTime,
    nlPort: typeof window !== 'undefined' ? (window as any).NL_PORT : undefined,
    nlPath: typeof window !== 'undefined' ? (window as any).NL_PATH : undefined,
    nlToken: typeof window !== 'undefined' ? Boolean((window as any).NL_TOKEN) : false,
    neutralinoAvailable: typeof Neutralino !== 'undefined'
  };
}

export async function checkBackendHealth(): Promise<boolean> {
  const start = performance.now();
  const check = async (url: string) => {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 1200);
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
    lastPingLatency = Math.round(performance.now() - start);
    lastHealthCheckTime = Date.now();
    setWorkingBaseUrl('http://localhost:3000');
    if (!isBackendHealthy) {
      addDesktopLog('success', `Motor local verificado em http://localhost:3000 (${lastPingLatency}ms)`);
    }
    isBackendHealthy = true;
    return true;
  }

  if (await check('http://127.0.0.1:3000/api/health')) {
    lastPingLatency = Math.round(performance.now() - start);
    lastHealthCheckTime = Date.now();
    setWorkingBaseUrl('http://127.0.0.1:3000');
    if (!isBackendHealthy) {
      addDesktopLog('success', `Motor local verificado em http://127.0.0.1:3000 (${lastPingLatency}ms)`);
    }
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
    (window as any).NL_TOKEN !== undefined ||
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

    addDesktopLog('info', 'Servidor na porta 3000 offline. Disparando motor Node.js...');
    await initDesktopBackend();

    // Poll for up to 8 seconds
    const start = Date.now();
    while (Date.now() - start < 8000) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkBackendHealth()) {
        addDesktopLog('success', 'Servidor local conectado e pronto na porta 3000!');
        window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
        return true;
      }
    }

    addDesktopLog('warn', 'Servidor não respondeu na porta 3000. Dê 2 cliques em "Iniciar-CaranguejoRPG.bat" na pasta se necessário.');
    return false;
  })();

  const result = await healthCheckPromise;
  healthCheckPromise = null;
  return result;
}

export async function forceRestartBackend(): Promise<boolean> {
  isBackendStarting = false;
  isBackendHealthy = false;
  addDesktopLog('warn', 'Solicitado reinício do motor local...');
  await initDesktopBackend();
  const start = Date.now();
  while (Date.now() - start < 6000) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkBackendHealth()) {
      addDesktopLog('success', 'Motor pronto para conexões na porta 3000.');
      window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
      return true;
    }
  }
  return false;
}

export async function initDesktopBackend() {
  if (isBackendStarting) return;
  isBackendStarting = true;

  // Initialize Neutralino API safely once
  if (!neutralinoInitialized && typeof Neutralino !== 'undefined' && Neutralino.init) {
    try {
      Neutralino.init();
      neutralinoInitialized = true;
    } catch {}
  }

  if (!isDesktopEnvironment()) {
    isBackendStarting = false;
    return;
  }

  // If already healthy, do nothing
  if (await checkBackendHealth()) {
    isBackendStarting = false;
    window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
    return;
  }

  const nlPath = (window as any).NL_PATH || '.';
  addDesktopLog('info', `Pasta da aplicação: "${nlPath}"`);

  // Format safe path for Windows cmd
  const cleanPath = nlPath.replace(/\//g, '\\').replace(/\\$/, '');
  
  // Single, safe background command that launches ONLY the node server (never launches CaranguejoRPG.exe!)
  const nodeServerCmd = `cmd.exe /c "cd /d "${cleanPath}" && if exist node.exe (start "CaranguejoRPG-Server" /b node.exe dist\\server.cjs) else (start "CaranguejoRPG-Server" /b node dist\\server.cjs)"`;

  try {
    addDesktopLog('info', 'Iniciando servidor local em segundo plano...');
    if (typeof Neutralino !== 'undefined' && Neutralino.os && Neutralino.os.execCommand) {
      await Neutralino.os.execCommand(nodeServerCmd, { background: true }).catch((e: any) => {
        addDesktopLog('warn', `Aviso ao executar comando: ${e?.message}`);
      });
    } else {
      addDesktopLog('warn', 'Neutralino.os indisponível no navegador web.');
    }
  } catch (err: any) {
    addDesktopLog('error', `Erro ao iniciar processo do servidor: ${err?.message}`);
  }

  // Poll for readiness
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkBackendHealth()) {
      isBackendStarting = false;
      addDesktopLog('success', 'Motor conectado na porta 3000!');
      window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
      return;
    }
  }

  isBackendStarting = false;
}

// Listen to Neutralino lifecycle
try {
  if (typeof Neutralino !== 'undefined' && Neutralino.events?.on) {
    Neutralino.events.on('ready', () => {
      initDesktopBackend();
    });

    Neutralino.events.on('windowClose', async () => {
      try {
        await Neutralino.app.exit();
      } catch {}
    });
  }
} catch {}
