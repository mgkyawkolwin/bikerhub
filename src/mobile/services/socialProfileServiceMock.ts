import type SocialProfile from '@/models/socialProfile';
import type Follower from '@/models/follower';
import type Following from '@/models/following';
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

  async searchProfiles(query: string): Promise<Response> {
    const db = await this.getDb();
    const normalized = query.trim().toLowerCase();
    const results = (db.collections.socialProfiles as SocialProfile[] | undefined)?.filter((profile) =>
      profile.displayName.toLowerCase().includes(normalized) || profile.userName.toLowerCase().includes(normalized)
    ) ?? [];
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: results })));
  }

  async followUser(followingId: string): Promise<Response> {
    // Mock implementation
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: {
        isFollowing: true,
        followersCount: 1,
        followingCount: 1
      }
    })));
  }

  async unfollowUser(followingId: string): Promise<Response> {
    // Mock implementation
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: {
        isFollowing: false,
        followersCount: 0,
        followingCount: 0
      }
    })));
  }

  async isFollowing(followingId: string): Promise<Response> {
    // Mock implementation
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: {
        isFollowing: false
      }
    })));
  }

  async getFollowers(userId: string): Promise<Response> {
    // Mock implementation
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: []
    })));
  }

  async getFollowing(userId: string): Promise<Response> {
    // Mock implementation
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: []
    })));
  }
}
