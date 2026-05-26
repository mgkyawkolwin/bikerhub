import SocialPost from '@/models/socialPost';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi } from './apiClient';

export const SocialPostServiceToken = Symbol('SocialPostService');

export interface SocialPostService {
  getPosts(page: number, pageSize: number): Promise<PaginatedResult<SocialPost>>;
  getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<PaginatedResult<SocialPost>>;
}

export class SocialPostServiceClient implements SocialPostService {
  async getPosts(page: number, pageSize: number): Promise<PaginatedResult<SocialPost>> {
    return fetchApi<PaginatedResult<SocialPost>>(`/api/social/posts?page=${page}&pageSize=${pageSize}`);
  }

  async getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<PaginatedResult<SocialPost>> {
    return fetchApi<PaginatedResult<SocialPost>>(`/api/social/posts?authorId=${encodeURIComponent(authorId)}&page=${page}&pageSize=${pageSize}`);
  }
}
