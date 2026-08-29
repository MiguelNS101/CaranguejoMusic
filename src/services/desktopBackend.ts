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
let isBackendStarted = false;
let isBackendHealthy = false;
let spawnedProcessId: any = null;
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

  // Also log to console
  const prefix = `[${timeStr}] [DESKTOP] [${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(`${prefix} ${message}`, details || '');
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`, details || '');
  } else {
    console.log(`${prefix} ${message}`, details || '');
  }

  // Dispatch event for UI listeners
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
      addDesktopLog('success', `Motor local online e verificado em http://localhost:3000 (${lastPingLatency}ms)`);
    }
    isBackendHealthy = true;
    return true;
  }

  if (await check('http://127.0.0.1:3000/api/health')) {
    lastPingLatency = Math.round(performance.now() - start);
    lastHealthCheckTime = Date.now();
    setWorkingBaseUrl('http://127.0.0.1:3000');
    if (!isBackendHealthy) {
      addDesktopLog('success', `Motor local online e verificado em http://127.0.0.1:3000 (${lastPingLatency}ms)`);
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
    addDesktopLog('info', 'Verificando status do motor local na porta 3000...');
    if (await checkBackendHealth()) {
      return true;
    }

    addDesktopLog('warn', 'Servidor na porta 3000 não respondeu. Tentando inicializar backend em segundo plano...');
    await initDesktopBackend();

    // Poll for up to 8 seconds
    const start = Date.now();
    while (Date.now() - start < 8000) {
      await new Promise((r) => setTimeout(r, 450));
      if (await checkBackendHealth()) {
        addDesktopLog('success', 'Servidor local subiu e respondeu com sucesso!');
        window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
        return true;
      }
    }

    addDesktopLog('error', 'Servidor local não iniciou automaticamente em 8 segundos. Verifique se Iniciar-CaranguejoRPG.bat foi executado na pasta.');
    return false;
  })();

  const result = await healthCheckPromise;
  healthCheckPromise = null;
  return result;
}

export async function forceRestartBackend(): Promise<boolean> {
  isBackendStarted = false;
  isBackendHealthy = false;
  addDesktopLog('warn', 'Solicitado reinício forçado do motor local...');
  await initDesktopBackend();
  const start = Date.now();
  while (Date.now() - start < 6000) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkBackendHealth()) {
      addDesktopLog('success', 'Motor reiniciado e pronto para conexões na porta 3000.');
      window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
      return true;
    }
  }
  return false;
}

export async function initDesktopBackend() {
  if (isBackendStarted) return;
  isBackendStarted = true;

  // Try initializing Neutralino if available
  if (!neutralinoInitialized && typeof Neutralino !== 'undefined' && Neutralino.init) {
    try {
      Neutralino.init();
      neutralinoInitialized = true;
      addDesktopLog('info', 'Neutralino.js client API inicializado.');
    } catch (e: any) {
      addDesktopLog('warn', `Neutralino.init avisou: ${e?.message}`);
    }
  }

  if (!isDesktopEnvironment()) {
    addDesktopLog('info', 'Ambiente web padrão detectado.');
    return;
  }

  // If already healthy, dispatch event and return
  if (await checkBackendHealth()) {
    addDesktopLog('success', 'Servidor já está rodando ativamente na porta 3000.');
    window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
    return;
  }

  addDesktopLog('info', 'Iniciando procedimentos de auto-lançamento do motor Node.js e Discord Bot...');

  let nlPath = (window as any).NL_PATH || '.';
  const nlPort = (window as any).NL_PORT;
  const nlToken = (window as any).NL_TOKEN;

  addDesktopLog('info', `Ambiente desktop detectado (NL_PATH: "${nlPath}", NL_PORT: ${nlPort || 'N/A'}, NL_TOKEN: ${nlToken ? 'Sim' : 'Não'})`);

  // Remove trailing slashes
  if (nlPath.endsWith('\\') || nlPath.endsWith('/')) {
    nlPath = nlPath.slice(0, -1);
  }

  const sanitizedNlPath = nlPath.replace(/\\/g, '/');

  // Command variations to ensure compatibility with Windows paths, drives and spaces
  const launchCommands = [
    // 1. Windows cmd with cd /d to avoid current directory issues
    `cmd.exe /c "cd /d "${nlPath}" && if exist node.exe (start "" /b node.exe dist/server.cjs) else (start "" /b node dist/server.cjs)"`,
    // 2. Direct embedded node.exe with full paths and quotes
    `"${nlPath}\\node.exe" "${nlPath}\\dist\\server.cjs"`,
    // 3. Batch launcher script in same directory
    `cmd.exe /c "cd /d "${nlPath}" && start "" /b Iniciar-CaranguejoRPG.bat"`,
    // 4. Forward slash format
    `cmd.exe /c "cd /d "${sanitizedNlPath}" && if exist node.exe (start "" /b node.exe dist/server.cjs) else (start "" /b node dist/server.cjs)"`,
    // 5. System node fallback
    `cmd.exe /c "cd /d "${nlPath}" && start "" /b node dist/server.cjs"`,
    // 6. Relative node.exe
    `cmd.exe /c "if exist node.exe (start "" /b node.exe dist/server.cjs) else (start "" /b node dist/server.cjs)"`
  ];

  for (const cmd of launchCommands) {
    try {
      addDesktopLog('info', `Executando: ${cmd}`);
      if (typeof Neutralino !== 'undefined' && Neutralino.os) {
        if (Neutralino.os.execCommand) {
          const execRes = await Neutralino.os.execCommand(cmd, { background: true }).catch((e: any) => {
            addDesktopLog('warn', `execCommand retornou erro: ${e?.message}`);
            return null;
          });
          if (execRes) {
            addDesktopLog('info', `Comando enviado via execCommand (PID ${execRes.pid || 'OK'})`);
          }
        }

        if (Neutralino.os.spawnProcess) {
          const proc = await Neutralino.os.spawnProcess(cmd).catch((e: any) => {
            addDesktopLog('warn', `spawnProcess falhou para: ${cmd}`, e?.message);
            return null;
          });
          if (proc) {
            spawnedProcessId = proc;
            addDesktopLog('success', `Processo disparado via spawnProcess (PID ${proc.id || proc.pid || 'OK'})`);
          }
        }
      } else {
        addDesktopLog('warn', 'Neutralino.os API indisponível no momento.');
      }
    } catch (e: any) {
      addDesktopLog('error', `Erro ao tentar executar comando: ${e?.message}`);
    }

    // Quick verification
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (await checkBackendHealth()) {
        addDesktopLog('success', 'Motor local conectado e respondendo na porta 3000!');
        window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
        return;
      }
    }
  }

  // Final wait cycle
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkBackendHealth()) {
      addDesktopLog('success', 'Servidor detectado online após ciclo de espera.');
      window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
      return;
    }
  }

  addDesktopLog('warn', 'Motor local não respondeu automaticamente. Dê 2 cliques em "Iniciar-CaranguejoRPG.bat" na pasta do app.');
}

// Listen to Neutralino lifecycle
try {
  if (typeof Neutralino !== 'undefined' && Neutralino.events?.on) {
    Neutralino.events.on('ready', () => {
      addDesktopLog('info', 'Evento Neutralino ready disparado.');
      initDesktopBackend();
    });

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
} catch (err: any) {
  console.warn('Neutralino events initialization skipped:', err?.message);
}
