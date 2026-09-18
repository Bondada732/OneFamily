export const getApiBase = (): string => {
  // If deployed on Vercel or cloud with a custom backend URL
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }

  if (typeof window !== 'undefined') {
    // Custom host saved in localStorage
    const savedHost = localStorage.getItem('onefamily_api_host');
    if (savedHost) {
      return `${savedHost.replace(/\/$/, '')}/api`;
    }

    // If accessed via Vite dev server port (e.g. mobile browser at 192.168.1.6:5173 or localhost:5173)
    if (window.location.port === '5173') {
      return '/api';
    }

    // If running inside Capacitor Native APK on Android
    if (
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.location.port === '') ||
      (window as any).Capacitor?.isNativePlatform?.()
    ) {
      return 'http://192.168.1.6:4000/api';
    }
  }
  return '/api';
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  activeUserId?: string
): Promise<T> {
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

  let response: Response;
  try {
    response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error('Network connection error to', `${apiBase}${endpoint}:`, netErr);
    const err: any = new Error(
      `Cannot connect to server at ${apiBase}. Please verify your phone is connected to the same Wi-Fi network as your PC.`
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
    const err: any = new Error(errorData.message || errorData.error || 'Request failed');
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}

