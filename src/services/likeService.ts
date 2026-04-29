export const LikeServiceToken = Symbol('LikeService');

export interface LikeService {
  getLikedIds(): Promise<string[]>;
  toggleLike(listingId: string): Promise<void>;
  isLiked(listingId: string): Promise<boolean>;
}
