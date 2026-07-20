import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// const DEFAULT_API_BASE_URL = 'http://192.168.50.184:5426/api';
const DEFAULT_API_BASE_URL = 'https://bhapi.preview.software/api';
// const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = DEFAULT_API_BASE_URL;
const AUTH_USER_STORAGE_KEY = 'auth_user';

export type ApiResponse<T> = {
  Success: boolean;
  Data?: T;
  Message?: string;
};

export async function fetchJson(path: string, options: RequestInit = {}): Promise<Response> {
  console.log('API Request:', { API_BASE_URL, path, options });
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  console.log('API Response:', { path, status: response.status });
  return response;
}

export async function authenticatedFetchJson(path: string, options: RequestInit = {}): Promise<Response> {
  const authUserJson = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
  const token = authUserJson ? (JSON.parse(authUserJson)?.token as string | undefined) : undefined;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchJson(path, { ...options, headers });

  // Handle 401 Unauthorized response - token is invalid/expired
  if (response.status === 401) {
    // Clear stored auth user
    await SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY);
    // Redirect to sign in page
    router.replace('/auth/signIn');
  }

  return response;
}

export async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  return fetchJson(path, options);
}

export async function authenticatedFetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  console.log('Authenticated API Request:', { path, options });
  return authenticatedFetchJson(path, options);
}
