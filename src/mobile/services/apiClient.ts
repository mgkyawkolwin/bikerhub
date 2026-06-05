import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_BASE_URL = 'http://192.168.51.3:5264/api';
export const API_BASE_URL = DEFAULT_API_BASE_URL;
const AUTH_USER_STORAGE_KEY = 'auth_user';

export type ApiResponse<T> = {
  Success: boolean;
  Data?: T;
  Message?: string;
};

export async function fetchJson(path: string, options: RequestInit = {}): Promise<Response> {
  console.log('API Request:', { API_BASE_URL, path, options });
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    ...options,
  });

  console.log('API Response:', { path, status: response.status });
  return response;
}

export async function authenticatedFetchJson(path: string, options: RequestInit = {}): Promise<Response> {
  const authUserJson = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
  const token = authUserJson ? (JSON.parse(authUserJson)?.token as string | undefined) : undefined;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetchJson(path, { ...options, headers });
}

export async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  return fetchJson(path, options);
}

export async function authenticatedFetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  return authenticatedFetchJson(path, options);
}
