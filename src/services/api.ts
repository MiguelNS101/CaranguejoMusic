/**
 * Resolves API and media URLs properly whether running in standard web browser,
 * Cloud Run / AI Studio container, or Desktop executable (Neutralino.js / Electron)
 * where the frontend is served on a different local port than the backend (port 3000).
 */

import { addDesktopLog } from './desktopBackend';

let cachedWorkingBase: string | null = null;

export function getLocalBaseUrl(): string {
  if (cachedWorkingBase) return cachedWorkingBase;
  return 'http://localhost:3000';
}

export function setWorkingBaseUrl(base: string) {
  cachedWorkingBase = base;
}

export function resolveApiUrl(url: string, baseOverride?: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  if (typeof window !== 'undefined') {
    const isDesktop =
      (window as any).NL_PORT !== undefined ||
      (window as any).Neutralino !== undefined ||
      window.location.protocol === 'file:';

    const isLocalDifferentPort =
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.port !== '' &&
      window.location.port !== '3000';

    if (isDesktop || isLocalDifferentPort) {
      const base = baseOverride || getLocalBaseUrl();
      return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
    }
  }

  return url;
}

/**
 * Standard fetch wrapped with automatic URL resolution for API / media endpoints.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const resolved = resolveApiUrl(input);
  try {
    return await fetch(resolved, init);
  } catch (err: any) {
    // If localhost failed in desktop/local mode, attempt 127.0.0.1 as fallback
    if (typeof window !== 'undefined' && resolved.includes('localhost:3000')) {
      const fallbackUrl = resolved.replace('localhost:3000', '127.0.0.1:3000');
      try {
        const res = await fetch(fallbackUrl, init);
        setWorkingBaseUrl('http://127.0.0.1:3000');
        return res;
      } catch {}
    }
    throw err;
  }
}

/**
 * Safe fetch utility to prevent "Unexpected end of JSON input" and infinite loading errors.
 * Parses response text and safely converts to JSON or provides clean fallback with 12s timeout.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 12000
): Promise<{ success: boolean; data?: T; error?: string; status: number }> {
  const isDesktopEnv =
    typeof window !== 'undefined' &&
    ((window as any).NL_PORT !== undefined ||
      (window as any).Neutralino !== undefined ||
      window.location.protocol === 'file:' ||
      ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        window.location.port !== '3000'));

  const primaryUrl = resolveApiUrl(url);

  // Set up abort controller for timeout protection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const signal = options?.signal || controller.signal;

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      signal,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = null;

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawText: text };
      }
    }

    if (!res.ok) {
      const errMsg = data?.error || data?.message || (text.trim() ? text : `Erro HTTP ${res.status}`);
      addDesktopLog('warn', `API ${url} retornou HTTP ${res.status}: ${errMsg}`);
      return { success: false, data, error: errMsg, status: res.status };
    }

    return {
      success: data ? (data.success !== false) : true,
      data: data as T,
      error: data?.error,
      status: res.status
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    const isTimeout = err?.name === 'AbortError';

    // If primary localhost failed, try 127.0.0.1 fallback
    if (isDesktopEnv && primaryUrl.includes('localhost:3000') && !isTimeout) {
      try {
        const altCtrl = new AbortController();
        const altTimeout = setTimeout(() => altCtrl.abort(), 4000);
        const altUrl = primaryUrl.replace('localhost:3000', '127.0.0.1:3000');

        const altRes = await fetch(altUrl, {
          ...options,
          signal: altCtrl.signal,
          headers: {
            'Accept': 'application/json',
            ...(options?.headers || {})
          }
        });

        clearTimeout(altTimeout);

        const altText = await altRes.text();
        let altData: any = null;
        if (altText && altText.trim().length > 0) {
          try {
            altData = JSON.parse(altText);
          } catch {
            altData = { rawText: altText };
          }
        }

        if (!altRes.ok) {
          const errMsg = altData?.error || altData?.message || `Erro HTTP ${altRes.status}`;
          return { success: false, data: altData, error: errMsg, status: altRes.status };
        }

        setWorkingBaseUrl('http://127.0.0.1:3000');
        return {
          success: altData ? (altData.success !== false) : true,
          data: altData as T,
          error: altData?.error,
          status: altRes.status
        };
      } catch {}
    }

    let fallbackMsg: string;
    if (isTimeout) {
      fallbackMsg = 'Tempo limite excedido na requisição com o servidor local (timeout 12s).';
      addDesktopLog('error', `Timeout na requisição ${url}`, undefined, 'network');
    } else if (isDesktopEnv) {
      fallbackMsg = 'O motor local de som e bot (porta 3000) não está respondendo. Verifique se Iniciar-CaranguejoRPG.bat está rodando ou use a aba Diagnóstico.';
      addDesktopLog('error', `Falha de conexão com ${url}: ${err?.message || 'Erro de rede'}`, undefined, 'network');
    } else {
      fallbackMsg = err?.message || 'Falha na comunicação com o servidor.';
    }

    return {
      success: false,
      error: fallbackMsg,
      status: 0
    };
  }
}
