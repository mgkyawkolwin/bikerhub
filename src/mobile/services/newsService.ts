import News from '@/models/news';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi } from './apiClient';

export const NewsServiceToken = Symbol('NewsService');

export interface NewsService {
  getNews(page: number, pageSize: number): Promise<Response>;
  getNewsById(id: string): Promise<Response>;
}

export class NewsServiceClient implements NewsService {
  async getNews(page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/news?page=${page}&pageSize=${pageSize}`);
  }

  async getNewsById(id: string): Promise<Response> {
    return fetchApi(`/news/${encodeURIComponent(id)}`);
  }
}
