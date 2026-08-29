/**
 * Resolves API and media URLs properly whether running in standard web browser,
 * Cloud Run / AI Studio container, or Desktop executable (Neutralino.js / Electron)
 * where the frontend is served on a different local port than the backend (port 3000).
 */
export function resolveApiUrl(url: string): string {
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
      const base = 'http://localhost:3000';
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
  return fetch(resolved, init);
}

/**
 * Safe fetch utility to prevent "Unexpected end of JSON input" errors.
 * Parses response text and safely converts to JSON or provides clean fallback.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; status: number }> {
  try {
    const fullUrl = resolveApiUrl(url);
    const res = await fetch(fullUrl, {
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
    return {
      success: false,
      error: err?.message || 'Falha na comunicação com o servidor local.',
      status: 0
    };
  }
}

