import type Follower from '@/models/follower';
import type Following from '@/models/following';
import { fetchApi } from './apiClient';

export const FollowServiceToken = Symbol('FollowService');

export interface IFollowResponse {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface FollowService {
  followUser(userId: string): Promise<IFollowResponse>;
  unfollowUser(userId: string): Promise<IFollowResponse>;
  isFollowing(userId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<Follower[]>;
  getFollowing(userId: string): Promise<Following[]>;
}

export class FollowServiceClient implements FollowService {
  async followUser(userId: string): Promise<IFollowResponse> {
    const response = await fetchApi(`/social/follow/${encodeURIComponent(userId)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to follow user');
    }

    const data = await response.json();
    return data.data;
  }

  async unfollowUser(userId: string): Promise<IFollowResponse> {
    const response = await fetchApi(`/social/follow/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unfollow user');
    }

    const data = await response.json();
    return data.data;
  }

  async isFollowing(userId: string): Promise<boolean> {
    const response = await fetchApi(`/social/follow/${encodeURIComponent(userId)}/is-following`, {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.data?.isFollowing ?? false;
  }

  async getFollowers(userId: string): Promise<Follower[]> {
    const response = await fetchApi(`/social/followers/${encodeURIComponent(userId)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch followers');
    }

    const data = await response.json();
    return data.data ?? [];
  }

  async getFollowing(userId: string): Promise<Following[]> {
    const response = await fetchApi(`/social/following/${encodeURIComponent(userId)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch following');
    }

    const data = await response.json();
    return data.data ?? [];
  }
}
