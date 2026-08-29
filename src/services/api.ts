/**
 * Safe fetch utility to prevent "Unexpected end of JSON input" errors.
 * Parses response text and safely converts to JSON or provides clean fallback.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(url, {
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
