export default class SocialPost {
  id?: string;
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  groupId?: string;
  content?: string;
  imageUrls?: string[];
  loveCount?: number;
  commentCount?: number;
  shareCount?: number;
  createdAt?: string;
}
