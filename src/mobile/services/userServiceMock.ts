import type { PaginatedResult } from '../models/paginatedResult';
import { getDatabase } from './localDatabase';
import { UserService } from './userService';


function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export class MockUserService implements UserService {
  private dbPromise = getDatabase();
  private readonly currentUserId = '00000000-0000-0000-0000-000000000000';

  private async getDb() {
    return this.dbPromise;
  }

  async getFavoriteListings(page: number, pageSize: number) {
    const db = await this.getDb();
    const filtered = db.collections.listings.filter((item) =>item.isFavorite);
    const result = paginate(filtered, page, pageSize);
    return result;
  }

}
