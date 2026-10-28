const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('openprocure_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('openprocure_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('openprocure_token');
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = 'An error occurred';
    try {
      const errData = await response.json();
      errMessage = errData.detail || errData.message || JSON.stringify(errData);
    } catch {
      errMessage = await response.text();
    }
    throw new Error(errMessage);
  }

  return response.json();
}
