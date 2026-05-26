import type SocialProfile from '@/models/socialProfile';
import type { SocialProfileService } from './socialProfileService';
import { getDatabase } from './localDatabase';

export class MockSocialProfileService implements SocialProfileService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getProfileById(profileId: string): Promise<SocialProfile | undefined> {
    const db = await this.getDb();
    return (db.collections.socialProfiles as SocialProfile[] | undefined)?.find((profile) => profile.id === profileId);
  }
}
