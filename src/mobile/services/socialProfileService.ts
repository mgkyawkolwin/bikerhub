import type SocialProfile from '@/models/socialProfile';
import type Follower from '@/models/follower';
import type Following from '@/models/following';
import { fetchApi } from './apiClient';

export const SocialProfileServiceToken = Symbol('SocialProfileService');

export interface SocialProfileService {
  getProfileById(profileId: string): Promise<Response>;
  searchProfiles(query: string): Promise<Response>;
  followUser(followingId: string): Promise<Response>;
  unfollowUser(followingId: string): Promise<Response>;
  isFollowing(followingId: string): Promise<Response>;
  getFollowers(userId: string): Promise<Response>;
  getFollowing(userId: string): Promise<Response>;
}

export class SocialProfileServiceClient implements SocialProfileService {
  async getProfileById(profileId: string): Promise<Response> {
    return fetchApi(`/social/profiles/${encodeURIComponent(profileId)}`);
  }

  async searchProfiles(query: string): Promise<Response> {
    return fetchApi(`/social/profiles/search?query=${encodeURIComponent(query)}`);
  }

  async followUser(followingId: string): Promise<Response> {
    return fetchApi(`/social/follow/${encodeURIComponent(followingId)}`, {
      method: 'POST',
    });
  }

  async unfollowUser(followingId: string): Promise<Response> {
    return fetchApi(`/social/follow/${encodeURIComponent(followingId)}`, {
      method: 'DELETE',
    });
  }

  async isFollowing(followingId: string): Promise<Response> {
    return fetchApi(`/social/follow/${encodeURIComponent(followingId)}/is-following`, {
      method: 'GET',
    });
  }

  async getFollowers(userId: string): Promise<Response> {
    return fetchApi(`/social/followers/${encodeURIComponent(userId)}`);
  }

  async getFollowing(userId: string): Promise<Response> {
    return fetchApi(`/social/following/${encodeURIComponent(userId)}`);
  }
}
