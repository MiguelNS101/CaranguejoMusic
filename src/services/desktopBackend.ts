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
  if (desktopLogs.length > 200) {
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

    // Poll for up to 6 seconds
    const start = Date.now();
    while (Date.now() - start < 6000) {
      await new Promise((r) => setTimeout(r, 400));
      if (await checkBackendHealth()) {
        addDesktopLog('success', 'Servidor local subiu e respondeu com sucesso!');
        window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
        return true;
      }
    }

    addDesktopLog('error', 'Servidor local não iniciou automaticamente em 6 segundos. Verifique se Iniciar-CaranguejoRPG.bat foi executado.');
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
  while (Date.now() - start < 5000) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkBackendHealth()) {
      addDesktopLog('success', 'Motor reiniciado e pronto para conexões.');
      window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
      return true;
    }
  }
  return false;
}

export async function initDesktopBackend() {
  if (isBackendStarted) return;
  isBackendStarted = true;

  if (!isDesktopEnvironment()) {
    addDesktopLog('info', 'Ambiente web padrão detectado (não requer spawn de executável desktop).');
    return;
  }

  // If already healthy, dispatch event and return
  if (await checkBackendHealth()) {
    addDesktopLog('success', 'Servidor já está rodando ativamente na porta 3000.');
    window.dispatchEvent(new CustomEvent('desktop-backend-ready'));
    return;
  }

  addDesktopLog('info', 'Iniciando procedimentos de auto-lançamento do motor Node.js e Discord Bot...');

  const nlPath = (window as any).NL_PATH || '.';
  addDesktopLog('info', `Caminho base detectado (NL_PATH): "${nlPath}"`);

  const sanitizedNlPath = nlPath.replace(/\\/g, '/');

  // Ordered list of launch commands for Windows Desktop
  const launchCommands = [
    // 1. Direct path with embedded node.exe
    `"${nlPath}\\node.exe" "${nlPath}\\dist\\server.cjs"`,
    // 2. Forward slash format
    `"${sanitizedNlPath}/node.exe" "${sanitizedNlPath}/dist/server.cjs"`,
    // 3. Batch launcher script in same folder
    `cmd /c start "" /b "${nlPath}\\Iniciar-CaranguejoRPG.bat"`,
    // 4. Background start via cmd with node.exe
    `cmd /c start "" /b "${nlPath}\\node.exe" "${nlPath}\\dist\\server.cjs"`,
    // 5. System node fallback
    `cmd /c start "" /b node "${nlPath}\\dist\\server.cjs"`,
    // 6. Relative node.exe
    `.\\node.exe dist/server.cjs`,
    // 7. System node
    `node dist/server.cjs`
  ];

  for (const cmd of launchCommands) {
    try {
      addDesktopLog('info', `Tentando comando: ${cmd}`);
      if (typeof Neutralino !== 'undefined' && Neutralino.os) {
        if (Neutralino.os.spawnProcess) {
          const proc = await Neutralino.os.spawnProcess(cmd).catch((e: any) => {
            addDesktopLog('warn', `spawnProcess falhou para: ${cmd}`, e?.message);
            return null;
          });
          if (proc) {
            spawnedProcessId = proc;
            addDesktopLog('success', `Processo disparado via Neutralino.os.spawnProcess (PID ${proc.id || proc.pid || 'OK'})`);
          }
        }
        if (Neutralino.os.execCommand) {
          Neutralino.os.execCommand(cmd, { background: true }).catch((e: any) => {
            addDesktopLog('warn', `execCommand falhou para: ${cmd}`, e?.message);
            return null;
          });
          addDesktopLog('info', `Executado via Neutralino.os.execCommand em background.`);
        }
      } else {
        addDesktopLog('warn', 'Neutralino.os não disponível no momento para disparar o comando.');
      }
    } catch (e: any) {
      addDesktopLog('error', `Erro ao tentar executar comando "${cmd}": ${e?.message}`);
    }

    // Quick verification
    for (let i = 0; i < 3; i++) {
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

  addDesktopLog('warn', 'Fim das tentativas automáticas. Se o bot não responder, abra o Iniciar-CaranguejoRPG.bat.');
}

// Listen to Neutralino lifecycle
try {
  if (typeof Neutralino !== 'undefined' && Neutralino.events?.on) {
    Neutralino.events.on('ready', () => {
      addDesktopLog('info', 'Neutralino Desktop pronto. Verificando motor...');
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
