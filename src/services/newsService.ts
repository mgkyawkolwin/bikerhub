import News from '@/models/news';
import type { PaginatedResult } from '@/models/paginatedResult';

export const NewsServiceToken = Symbol('NewsService');

export interface NewsService {
  getNews(page: number, pageSize: number): Promise<PaginatedResult<News>>;
  getNewsById(id: string): Promise<News | undefined>;
}
