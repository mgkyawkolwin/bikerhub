import News from '@/models/news';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { NewsService } from './newsService';
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

export class MockNewsService implements NewsService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getNews(page: number, pageSize: number): Promise<PaginatedResult<News>> {
    const db = await this.getDb();
    const articles = (db.collections.news as News[] | undefined) ?? [];
    const sorted = articles
      .slice()
      .sort((a, b) => new Date(b.dateTimeUTC ?? '').getTime() - new Date(a.dateTimeUTC ?? '').getTime());
    return paginate(sorted, page, pageSize);
  }

  async getNewsById(id: string): Promise<News | undefined> {
    const db = await this.getDb();
    return (db.collections.news as News[] | undefined)?.find((article) => article.id === id);
  }
}
