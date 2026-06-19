import Post from '@/models/post';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const SocialPostServiceToken = Symbol('SocialPostService');

export type CreatePostPayload = {
  createdById: string;
  content?: string;
  imageUrls?: string[];
  visibility?: 'Public' | 'Friends Only';
};

export interface SocialPostService {
  getPosts(page: number, pageSize: number): Promise<Response>;
  getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<Response>;
  getPostById(postId: string): Promise<Response>;
  createPost(payload: CreatePostPayload): Promise<Response>;
  toggleLove(postId: string): Promise<Response>;
}

export class SocialPostServiceClient implements SocialPostService {
  async getPosts(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/social/posts?list=feed&page=${page}&pageSize=${pageSize}`);
  }

  async getPostsByAuthor(authorId: string, page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/social/posts?list=profile&createdById=${encodeURIComponent(authorId)}&page=${page}&pageSize=${pageSize}`);
  }

  async createPost(payload: CreatePostPayload): Promise<Response> {
    return authenticatedFetchApi('/social/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPostById(postId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}`);
  }

  async toggleLove(postId: string): Promise<Response> {
    console.debug('Toggling love for post:', postId);
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}/love`, {
      method: 'PATCH'
    });
  }
}
