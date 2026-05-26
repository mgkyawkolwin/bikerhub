import News from '@/models/news';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi } from './apiClient';

export const NewsServiceToken = Symbol('NewsService');

export interface NewsService {
  getNews(page: number, pageSize: number): Promise<PaginatedResult<News>>;
  getNewsById(id: string): Promise<News | undefined>;
}

export class NewsServiceClient implements NewsService {
  async getNews(page: number, pageSize: number): Promise<PaginatedResult<News>> {
    return fetchApi<PaginatedResult<News>>(`/api/news?page=${page}&pageSize=${pageSize}`);
  }

  async getNewsById(id: string): Promise<News | undefined> {
    return fetchApi<News | undefined>(`/api/news/${encodeURIComponent(id)}`);
  }
}
