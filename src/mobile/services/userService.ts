import type { BikeListing } from '@/models/bikeListing';
import type { PaginatedResult } from '@/models/paginatedResult';
import { authenticatedFetchApi } from './apiClient';

export const UserServiceToken = Symbol('UserService');

export interface UserService {
  getFavoriteListings(page: number, pageSize: number): Promise<Response>;
}

export class UserServiceClient implements UserService {
  async getFavoriteListings(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/users/me/favorites?page=${page}&pageSize=${pageSize}`);
  }
}
