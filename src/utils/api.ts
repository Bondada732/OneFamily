export const DEFAULT_SERVER_URL = 'https://onefamily-ydkb.onrender.com';

export const getApiHost = (): string => {
  if (typeof window !== 'undefined') {
    const savedHost = localStorage.getItem('onefamily_api_host');
    if (savedHost) {
      return savedHost.replace(/\/$/, '');
    }
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return DEFAULT_SERVER_URL;
};

export const setCustomApiHost = (host: string): void => {
  if (typeof window !== 'undefined') {
    const cleanHost = host.trim().replace(/\/$/, '');
    if (cleanHost) {
      localStorage.setItem('onefamily_api_host', cleanHost);
    } else {
      localStorage.removeItem('onefamily_api_host');
    }
  }
};

export const testServerConnection = async (
  targetHost?: string
): Promise<{ success: boolean; latencyMs?: number; error?: string }> => {
  const host = targetHost ? targetHost.replace(/\/$/, '') : getApiHost();
  const testUrl = `${host}/api/health`;
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return { success: true, latencyMs: Date.now() - startTime };
    }
    return { success: false, error: `Server returned status ${res.status}` };
  } catch (err: any) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Connection timed out (4s)' : (err.message || 'Cannot reach server'),
    };
  }
};

export const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }

  if (typeof window !== 'undefined') {
    const savedHost = localStorage.getItem('onefamily_api_host');
    if (savedHost) {
      return `${savedHost.replace(/\/$/, '')}/api`;
    }

    // If accessed via Vite dev server port (e.g. mobile browser at 10.160.2.158:5173 or localhost:5173)
    if (window.location.port === '5173') {
      return '/api';
    }

    // If running inside Capacitor Native APK on Android
    if (
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.location.port === '') ||
      (window as any).Capacitor?.isNativePlatform?.()
    ) {
      return `${DEFAULT_SERVER_URL}/api`;
    }
  }
  return '/api';
};

export const getCachedApiResponse = <T = any>(endpoint: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`kinora_api_cache_${endpoint}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
};

export const setCachedApiResponse = (endpoint: string, data: any): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `kinora_api_cache_${endpoint}`,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {}
};

// Fire and forget server warm-up ping on app start
let warmupInitiated = false;
export const warmupBackendServer = (): void => {
  if (warmupInitiated || typeof window === 'undefined') return;
  warmupInitiated = true;
  const host = getApiHost();
  fetch(`${host}/api/health`, { method: 'GET' }).catch(() => {});
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  activeUserId?: string
): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const token = localStorage.getItem('onefamily_token');
  const activeUser = activeUserId || localStorage.getItem('onefamily_active_user_id');
  const apiBase = getApiBase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(activeUser ? { 'x-active-user-id': activeUser } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set a 12s timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response: Response;
  try {
    response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (netErr: any) {
    clearTimeout(timeoutId);
    console.warn(`[API] Network issue on ${endpoint}:`, netErr.message || netErr);
    // If GET request fails (e.g. server cold start, offline), return cached data if available
    if (isGet) {
      const cached = getCachedApiResponse<T>(endpoint);
      if (cached !== null) {
        return cached;
      }
    }
    const err: any = new Error(
      `Cannot connect to server at ${apiBase}. Loading offline mode.`
    );
    err.isNetworkError = true;
    throw err;
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    // Fallback to cache if available
    if (isGet) {
      const cached = getCachedApiResponse<T>(endpoint);
      if (cached !== null) {
        return cached;
      }
    }
    const err: any = new Error(errorData.message || errorData.error || 'Request failed');
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  const result = await response.json();
  if (isGet) {
    setCachedApiResponse(endpoint, result);
  }
  return result;
}

