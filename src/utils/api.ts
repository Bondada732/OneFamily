const API_BASE = '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  activeUserId?: string
): Promise<T> {
  const token = localStorage.getItem('onefamily_token');
  const activeUser = activeUserId || localStorage.getItem('onefamily_active_user_id') || 'usr_raj';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-active-user-id': activeUser,
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
