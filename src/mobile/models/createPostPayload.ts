export type CreatePostPayload = {
  createdById: string;
  content?: string;
  visibility?: 'Public' | 'Friends Only';
};