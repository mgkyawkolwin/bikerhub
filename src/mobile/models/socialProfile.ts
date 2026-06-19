export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'telegram' | 'x' | 'tiktok' | 'web';

export default interface SocialProfile {
  id: string;
  userName: string;
  displayName: string;
  coverPhotoUrl: string;
  avatarUrl: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  garageCount: number;
  ridesCount: number;
  garageDistance?: string;
  garageDuration?: string;
  garageElevation?: string;
  rideDistance?: string;
  rideDuration?: string;
  rideElevation?: string;
  socialLinks: Array<{ platform: SocialPlatform; url: string }>;
}
