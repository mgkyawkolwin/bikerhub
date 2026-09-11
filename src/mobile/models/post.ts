export default class Post {
  id?: string;
  createdByUserId?: string;
  createdByUserName?: string;
  createdByDisplayName?: string;
  createdByUserProfilePhotoUrl?: string;
  groupId?: string;
  content?: string;
  shareUrl?: string;
  loveCount?: number;
  commentCount?: number;
  shareCount?: number;
  createdAtUTC?: string;
  isLikedByCurrentUser?: boolean;
  medias?: Array<{ id?: string; url?: string; contentType?: string }>;
}
