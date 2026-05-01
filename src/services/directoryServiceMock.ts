import Directory from '@/models/directory';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { DirectoryService } from './directoryService';
import { getDatabase } from './localDatabase';

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

export class MockDirectoryService implements DirectoryService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getDirectories(page: number, pageSize: number): Promise<PaginatedResult<Directory>> {
    const db = await this.getDb();
    const directories = (db.collections.directories as Directory[] | undefined) ?? [];
    const sorted = directories
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return paginate(sorted, page, pageSize);
  }

  async getDirectoryById(id: string): Promise<Directory | undefined> {
    const db = await this.getDb();
    return (db.collections.directories as Directory[] | undefined)?.find((item) => item.id === id);
  }
}
