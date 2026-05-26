import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_BASE_URL = 'http://localhost:5264/api';
export const API_BASE_URL = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
const AUTH_USER_STORAGE_KEY = 'auth_user';

export type ApiResponse<T> = {
  Success: boolean;
  Data?: T;
  Message?: string;
};

function unwrapApiResponse<T>(response: ApiResponse<T>, defaultError: string): T {
  if (!response.Success) {
    throw new Error(response.Message ?? defaultError);
  }

  if (response.Data === undefined || response.Data === null) {
    throw new Error(response.Message ?? defaultError);
  }

  return response.Data;
}

export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    ...options,
  });

  const contentType = response.headers.get('Content-Type');
  const body = contentType?.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = body?.message || body?.Message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return body as T;
}

export async function authenticatedFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authUserJson = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
  const token = authUserJson ? (JSON.parse(authUserJson)?.token as string | undefined) : undefined;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetchJson<T>(path, { ...options, headers });
}

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchJson<ApiResponse<T>>(path, options);
  return unwrapApiResponse(response, 'API request failed.');
}

export async function authenticatedFetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetchJson<ApiResponse<T>>(path, options);
  return unwrapApiResponse(response, 'Authenticated API request failed.');
}
