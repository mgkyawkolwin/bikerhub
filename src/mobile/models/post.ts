export default class Post {
  id?: string;
  createdById?: string;
  createdByName?: string;
  authorAvatarUrl?: string;
  groupId?: string;
  content?: string;
  imageUrls?: string[];
  loveCount?: number;
  commentCount?: number;
  shareCount?: number;
  createdAtUTC?: string;
  isLikedByCurrentUser?: boolean;
}
