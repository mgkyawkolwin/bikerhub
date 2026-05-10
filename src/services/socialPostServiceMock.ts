import SocialPost from '@/models/socialPost';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { SocialPostService } from './socialPostService';
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

  async getPosts(page: number, pageSize: number): Promise<PaginatedResult<SocialPost>> {
    const db = await this.getDb();
    const posts = (db.collections.socialPosts as SocialPost[] | undefined) ?? [];
    const sortedPosts = posts
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
    return paginate(sortedPosts, page, pageSize);
  }

  async getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<PaginatedResult<SocialPost>> {
    const db = await this.getDb();
    const posts = ((db.collections.socialPosts as SocialPost[] | undefined) ?? []).filter((post) => post.authorId === authorId);
    const sortedPosts = posts
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
    return paginate(sortedPosts, page, pageSize);
  }
}
