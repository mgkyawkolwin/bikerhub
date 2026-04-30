import type { BikeListing } from '@/models/bikeListing';
import type { PaginatedResult } from '@/models/paginatedResult';

export const UserServiceToken = Symbol('UserService');

export interface UserService {
  getFavoriteListings(page: number, pageSize: number): Promise<PaginatedResult<BikeListing>>;
}
