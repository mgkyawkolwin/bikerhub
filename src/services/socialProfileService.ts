import type SocialProfile from '@/models/socialProfile';

export const SocialProfileServiceToken = Symbol('SocialProfileService');

export interface SocialProfileService {
  getProfileById(profileId: string): Promise<SocialProfile | undefined>;
}
