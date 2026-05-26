import type { BikeListing } from '@/models/bikeListing';
import type { PaginatedResult } from '@/models/paginatedResult';
import { authenticatedFetchApi } from './apiClient';

export const UserServiceToken = Symbol('UserService');

export interface UserService {
  getFavoriteListings(page: number, pageSize: number): Promise<PaginatedResult<BikeListing>>;
}

export class UserServiceClient implements UserService {
  async getFavoriteListings(page: number, pageSize: number): Promise<PaginatedResult<BikeListing>> {
    return authenticatedFetchApi<PaginatedResult<BikeListing>>(`/api/users/me/favorites?page=${page}&pageSize=${pageSize}`);
  }
}
