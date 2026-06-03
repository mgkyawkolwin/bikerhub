import User from '@/models/user';
import { fetchJson } from './apiClient';

export const AuthServiceToken = Symbol('AuthService');

export interface AuthService {
  signIn(username: string, password: string): Promise<User>;
  register(name: string, password: string, email?: string, phone?: string): Promise<User>;
  signInWithGoogle(idToken: string): Promise<User>;
}

interface ApiAuthResponse {
  success: boolean;
  data?: {
    token?: string;
    user?: User;
  };
  message?: string;
}

export class AuthServiceClient implements AuthService {
  async signIn(username: string, password: string): Promise<User> {
    const result = await fetchJson<ApiAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Unable to sign in.');
    }

    const token = result.data.token ?? result.data.user?.token;
    const user = result.data.user;
    if (!token || !user) {
      throw new Error('Authentication service did not return a valid user payload.');
    }

    return { ...user, token };
  }

  async register(name: string, password: string, email?: string, phone?: string): Promise<User> {
    const result = await fetchJson<ApiAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Unable to register.');
    }

    const token = result.data.token ?? result.data.user?.token;
    const user = result.data.user;
    if (!token || !user) {
      throw new Error('Authentication service did not return a valid user payload.');
    }

    return { ...user, token };
  }

  async signInWithGoogle(idToken: string): Promise<User> {
    const result = await fetchJson<ApiAuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Unable to sign in with Google.');
    }

    const token = result.data.token ?? result.data.user?.token;
    const user = result.data.user;
    if (!token || !user) {
      throw new Error('Authentication service did not return a valid user payload.');
    }

    return { ...user, token };
  }
}
