/**
 * Resolves API and media URLs properly whether running in standard web browser,
 * Cloud Run / AI Studio container, or Desktop executable (Neutralino.js / Electron)
 * where the frontend is served on a different local port than the backend (port 3000).
 */

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
 * Safe fetch utility to prevent "Unexpected end of JSON input" errors.
 * Parses response text and safely converts to JSON or provides clean fallback.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; status: number }> {
  const isDesktopEnv =
    typeof window !== 'undefined' &&
    ((window as any).NL_PORT !== undefined ||
      (window as any).Neutralino !== undefined ||
      window.location.protocol === 'file:' ||
      ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        window.location.port !== '3000'));

  const primaryUrl = resolveApiUrl(url);

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

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
      return { success: false, data, error: errMsg, status: res.status };
    }

    return {
      success: data ? (data.success !== false) : true,
      data: data as T,
      error: data?.error,
      status: res.status
    };
  } catch (err: any) {
    // If primary localhost failed, try 127.0.0.1 fallback
    if (isDesktopEnv && primaryUrl.includes('localhost:3000')) {
      try {
        const altUrl = primaryUrl.replace('localhost:3000', '127.0.0.1:3000');
        const altRes = await fetch(altUrl, {
          ...options,
          headers: {
            'Accept': 'application/json',
            ...(options?.headers || {})
          }
        });

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

    const fallbackMsg = isDesktopEnv
      ? 'O motor local de som e bot (porta 3000) ainda está inicializando ou não está ativo. Aguarde 3 segundos e tente novamente, ou execute "Iniciar-CaranguejoRPG.bat".'
      : (err?.message || 'Falha na comunicação com o servidor.');

    return {
      success: false,
      error: fallbackMsg,
      status: 0
    };
  }
}
