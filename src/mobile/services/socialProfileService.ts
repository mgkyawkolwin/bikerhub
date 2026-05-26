import type SocialProfile from '@/models/socialProfile';
import { fetchApi } from './apiClient';

export const SocialProfileServiceToken = Symbol('SocialProfileService');

export interface SocialProfileService {
  getProfileById(profileId: string): Promise<SocialProfile | undefined>;
}

export class SocialProfileServiceClient implements SocialProfileService {
  async getProfileById(profileId: string): Promise<SocialProfile | undefined> {
    return fetchApi<SocialProfile | undefined>(`/api/social/profiles/${encodeURIComponent(profileId)}`);
  }
}
