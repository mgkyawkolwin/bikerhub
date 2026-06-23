export type CreatePostPayload = {
  createdById: string;
  content?: string;
  imageUrls?: string[];
  visibility?: 'Public' | 'Friends Only';
};