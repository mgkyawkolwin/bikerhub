import type SocialProfile from '@/models/socialProfile';
import { fetchApi } from './apiClient';

export const SocialProfileServiceToken = Symbol('SocialProfileService');

export interface SocialProfileService {
  getProfileById(profileId: string): Promise<Response>;
}

export class SocialProfileServiceClient implements SocialProfileService {
  async getProfileById(profileId: string): Promise<Response> {
    return fetchApi(`/api/social/profiles/${encodeURIComponent(profileId)}`);
  }
}
