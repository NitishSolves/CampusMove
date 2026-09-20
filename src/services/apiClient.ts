import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'smart_campus_bus_token';

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = `HTTP error ${response.status}: ${response.statusText}`;
    let errData: any = null;
    try {
      errData = await response.json();
      if (errData?.error) {
        errMessage = errData.error;
      }
    } catch {
      // Not JSON response
    }

    if (response.status === 401) {
      console.warn('API returned 401 Unauthorized.');
    }

    throw new ApiError(errMessage, response.status, errData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string, headers?: Record<string, string>) => request<T>(url, { method: 'GET', headers }),
  post: <T>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),
  put: <T>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),
  delete: <T>(url: string, headers?: Record<string, string>) => request<T>(url, { method: 'DELETE', headers }),
};
