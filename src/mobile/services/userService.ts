import type { BikeListing } from '@/models/bikeListing';
import type { PaginatedResult } from '@/models/paginatedResult';
import { authenticatedFetchApi } from './apiClient';

export const UserServiceToken = Symbol('UserService');

export interface UserService {
  getFavoriteListings(page: number, pageSize: number): Promise<Response>;
  changePassword(currentPassword: string, newPassword: string): Promise<Response>;
  updateProfile(displayName?: string, email?: string, phone?: string): Promise<Response>;
  getProfile(): Promise<Response>;
}

export class UserServiceClient implements UserService {
  async getFavoriteListings(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/users/me/favorites?page=${page}&pageSize=${pageSize}`);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<Response> {
    return authenticatedFetchApi('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async updateProfile(displayName?: string, email?: string, phone?: string): Promise<Response> {
    const body: any = {};
    if (displayName !== undefined) body.displayName = displayName;
    if (email !== undefined) body.email = email;
    if (phone !== undefined) body.phone = phone;
    return authenticatedFetchApi('/users/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async getProfile(): Promise<Response> {
    return authenticatedFetchApi('/users/me');
  }
}
