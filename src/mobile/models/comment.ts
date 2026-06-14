export default class Comment {
  id?: string;
  postId?: string;
  parentCommentId?: string | null;
  content?: string;
  createdAtUTC?: string;
  createdById?: string;
  createdByName?: string;
  replies?: Comment[];
}
