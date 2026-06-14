import type Comment from '@/models/comment';
import { authenticatedFetchApi } from './apiClient';

export const SocialCommentServiceToken = Symbol('SocialCommentService');

export interface SocialCommentService {
  getComments(postId: string): Promise<Response>;
  createComment(postId: string, content: string, parentCommentId?: string | null): Promise<Response>;
}

export class SocialCommentServiceClient implements SocialCommentService {
  async getComments(postId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}/comments`);
  }

  async createComment(postId: string, content: string, parentCommentId?: string | null): Promise<Response> {
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ postId, content, parentCommentId }),
    });
  }
}
