import SocialPost from '@/models/socialPost';
import type { PaginatedResult } from '@/models/paginatedResult';

export const SocialPostServiceToken = Symbol('SocialPostService');

export interface SocialPostService {
  getPosts(page: number, pageSize: number): Promise<PaginatedResult<SocialPost>>;
  getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<PaginatedResult<SocialPost>>;
}
