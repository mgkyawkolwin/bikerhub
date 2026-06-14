import Post from '@/models/post';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { SocialPostService } from './socialPostService';
import type { CreatePostPayload } from './socialPostService';
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

export class MockSocialPostService implements SocialPostService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getPosts(page: number, pageSize: number): Promise<Response> {
    const db = await this.getDb();
    const posts = (db.collections.socialPosts as Post[] | undefined) ?? [];
    const sortedPosts = posts
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
    const payload = JSON.stringify(paginate(sortedPosts, page, pageSize));
    return Promise.resolve(new Response(payload, { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  async getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<Response> {
    const db = await this.getDb();
    const posts = ((db.collections.socialPosts as Post[] | undefined) ?? []).filter((post) => post.createdById === authorId);
    const sortedPosts = posts
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
    const payload = JSON.stringify(paginate(sortedPosts, page, pageSize));
    return Promise.resolve(new Response(payload, { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  async createPost(payload: CreatePostPayload): Promise<Response> {
    return Promise.reject(new Error('MockSocialPostService.createPost is not implemented.'));
  }

  async toggleLove(postId: string): Promise<Response> {
    return Promise.reject(new Error('MockSocialPostService.toggleLove is not implemented.'));
  }
}
