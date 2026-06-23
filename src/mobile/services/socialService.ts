import type Follower from '@/models/follower';
import type Following from '@/models/following';
import { authenticatedFetchApi, fetchApi } from './apiClient';
import { CreatePostPayload } from '@/models/createPostPayload';

export const SocialServiceToken = Symbol('SocialServiceToken');


export interface ISocialService {
  followUser(userId: string): Promise<Response>;
  unfollowUser(userId: string): Promise<Response>;
  isFollowing(userId: string): Promise<Response>;
  getFollowers(userId: string): Promise<Response>;
  getFollowing(userId: string): Promise<Response>;
  sendFriendRequest(toProfileId: string): Promise<Response>;
  cancelFriendRequest(toProfileId: string): Promise<Response>;
  approveFriendRequest(requestId: string): Promise<Response>;
  rejectFriendRequest(requestId: string): Promise<Response>;
  getPendingFriendRequests(): Promise<Response>;
  getFriends(): Promise<Response>;
  removeFriend(userId: string): Promise<Response>;
  getComments(postId: string): Promise<Response>;
  createComment(postId: string, content: string, parentCommentId?: string | null): Promise<Response>;
  deleteComment(postId: string, commentId: string): Promise<Response>;
  getPosts(page: number, pageSize: number): Promise<Response>;
  getPostsByUser(authorId: string, page: number, pageSize: number): Promise<Response>;
  getPostById(postId: string): Promise<Response>;
  createPost(payload: CreatePostPayload): Promise<Response>;
  toggleLove(postId: string): Promise<Response>;
  getProfileById(profileId: string): Promise<Response>;
  updateSocialLinks(socialLinks: Array<{ platform: string; url: string }>): Promise<Response>;
  searchProfiles(query: string): Promise<Response>;
}


export class SocialServiceClient implements ISocialService {

  async followUser(userId: string): Promise<Response> {
    const response = await authenticatedFetchApi(`/social/follow/${encodeURIComponent(userId)}`, {
      method: 'POST',
    });

    return response;
  }

  async unfollowUser(userId: string): Promise<Response> {
    const response = await authenticatedFetchApi(`/social/follow/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    return response;
  }

  async isFollowing(userId: string): Promise<Response> {
    const response = await authenticatedFetchApi(`/social/follow/${encodeURIComponent(userId)}/is-following`, {
      method: 'GET',
    });

    return response;
  }

  async getFollowers(userId: string): Promise<Response> {
    const response = await authenticatedFetchApi(`/social/followers/${encodeURIComponent(userId)}`);

    return response;
  }

  async getFollowing(userId: string): Promise<Response> {
    const response = await authenticatedFetchApi(`/social/following/${encodeURIComponent(userId)}`);

    return response;
  }

  async sendFriendRequest(toProfileId: string): Promise<Response> {
    return authenticatedFetchApi('/social/friend-requests', {
      method: 'POST',
      body: JSON.stringify({ toProfileId }),
    });
  }

  async approveFriendRequest(requestId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/friend-requests/${encodeURIComponent(requestId)}/approve`, {
      method: 'PATCH',
    });
  }

  async cancelFriendRequest(toProfileId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/friend-requests/${encodeURIComponent(toProfileId)}`, {
      method: 'DELETE',
    });
  }

  async rejectFriendRequest(requestId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/friend-requests/${encodeURIComponent(requestId)}/reject`, {
      method: 'PATCH',
    });
  }

  async getPendingFriendRequests(): Promise<Response> {
    return authenticatedFetchApi('/social/friend-requests/pending');
  }

  async getFriends(): Promise<Response> {
    return authenticatedFetchApi('/social/friends');
  }

  async removeFriend(userId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/friends/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }

  async getComments(postId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}/comments`);
  }

  async createComment(postId: string, content: string, parentCommentId?: string | null): Promise<Response> {
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ postId, content, parentCommentId }),
    });
  }

  async deleteComment(postId: string, commentId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    });
  }

  async getPosts(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/social/posts?list=feed&page=${page}&pageSize=${pageSize}`);
  }

  async getPostsByUser(userId: string, page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/social/posts?list=profile&userId=${encodeURIComponent(userId)}&page=${page}&pageSize=${pageSize}`);
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

  async getProfileById(profileId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/profiles/${encodeURIComponent(profileId)}`);
  }

  async updateSocialLinks(socialLinks: Array<{ platform: string; url: string }>): Promise<Response> {
    return authenticatedFetchApi('/social/profiles/social-links', {
      method: 'PATCH',
      body: JSON.stringify({ socialLinks }),
    });
  }

  async searchProfiles(query: string): Promise<Response> {
    return authenticatedFetchApi(`/social/profiles/search?query=${encodeURIComponent(query)}`);
  }
}
