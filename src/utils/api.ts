const getApiBase = (): string => {
  // If deployed on Vercel with a custom backend URL
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }

  if (typeof window !== 'undefined') {
    // If accessed via Vite dev server port (e.g. mobile browser at 192.168.1.5:5173 or localhost:5173)
    if (window.location.port === '5173') {
      return '/api';
    }
    // If running inside Capacitor Native APK on Android
    if (window.location.protocol === 'capacitor:' || (window.location.hostname === 'localhost' && window.location.port === '')) {
      const customHost = localStorage.getItem('onefamily_api_host') || `http://${window.location.hostname === 'localhost' ? '192.168.1.6' : window.location.hostname}:4000`;
      return `${customHost}/api`;
    }
  }
  return '/api';
};

const API_BASE = getApiBase();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  activeUserId?: string
): Promise<T> {
  const token = localStorage.getItem('onefamily_token');
  const activeUser = activeUserId || localStorage.getItem('onefamily_active_user_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(activeUser ? { 'x-active-user-id': activeUser } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    const err: any = new Error(errorData.message || errorData.error || 'Request failed');
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}
