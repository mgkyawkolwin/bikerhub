import Blog from '@/models/blog';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { BlogService } from './blogService';
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

export class MockBlogService implements BlogService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getBlogs(page: number, pageSize: number): Promise<PaginatedResult<Blog>> {
    const db = await this.getDb();
    const blogs = (db.collections.blogs as Blog[] | undefined) ?? [];
    const sorted = blogs
      .slice()
      .sort((a, b) => new Date(b.dateTimeUTC ?? '').getTime() - new Date(a.dateTimeUTC ?? '').getTime());
    return paginate(sorted, page, pageSize);
  }

  async getBlogById(id: string): Promise<Blog | undefined> {
    const db = await this.getDb();
    return (db.collections.blogs as Blog[] | undefined)?.find((item) => item.id === id);
  }
}
