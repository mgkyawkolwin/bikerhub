import Blog from '@/models/blog';
import type { PaginatedResult } from '@/models/paginatedResult';

export const BlogServiceToken = Symbol('BlogService');

export interface BlogService {
  getBlogs(page: number, pageSize: number): Promise<PaginatedResult<Blog>>;
  getBlogById(id: string): Promise<Blog | undefined>;
  createBlog(blog: Blog): Promise<Blog>;
}
