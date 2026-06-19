export default interface Follower {
  id: string;
  userId: string;
  userName: string;
  displayName: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
}
