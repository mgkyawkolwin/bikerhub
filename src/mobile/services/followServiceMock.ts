import type Follower from '@/models/follower';
import type Following from '@/models/following';
import type { IFollowResponse, FollowService } from './followService';

export class MockFollowService implements FollowService {
  private followingMap: Map<string, Set<string>> = new Map();
  private followersMap: Map<string, Set<string>> = new Map();

  async followUser(userId: string): Promise<IFollowResponse> {
    // Mock implementation - simulate following a user
    if (!this.followingMap.has(userId)) {
      this.followingMap.set(userId, new Set());
    }
    
    const following = this.followingMap.get(userId)!;
    following.add(userId);

    return Promise.resolve({
      isFollowing: true,
      followersCount: (this.followersMap.get(userId)?.size ?? 0) + 1,
      followingCount: following.size,
    });
  }

  async unfollowUser(userId: string): Promise<IFollowResponse> {
    // Mock implementation - simulate unfollowing a user
    if (this.followingMap.has(userId)) {
      this.followingMap.get(userId)?.delete(userId);
    }

    return Promise.resolve({
      isFollowing: false,
      followersCount: this.followersMap.get(userId)?.size ?? 0,
      followingCount: this.followingMap.get(userId)?.size ?? 0,
    });
  }

  async isFollowing(userId: string): Promise<boolean> {
    // Mock implementation
    return Promise.resolve(false);
  }

  async getFollowers(userId: string): Promise<Follower[]> {
    // Mock implementation - return empty array
    return Promise.resolve([]);
  }

  async getFollowing(userId: string): Promise<Following[]> {
    // Mock implementation - return empty array
    return Promise.resolve([]);
  }
}
