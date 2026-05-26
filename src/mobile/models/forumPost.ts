export type ForumReply = {
  id: string;
  author: string;
  postedAt: string;
  content: string;
};

export default interface ForumPost {
  id: string;
  title: string;
  author: string;
  postedAt: string;
  category: string;
  views: number;
  excerpt: string;
  replies: ForumReply[];
  tags: string[];
}
