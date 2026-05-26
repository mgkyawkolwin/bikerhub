import Blog from '@/models/blog';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const BlogServiceToken = Symbol('BlogService');

export interface BlogService {
  getBlogs(page: number, pageSize: number): Promise<PaginatedResult<Blog>>;
  getBlogById(id: string): Promise<Blog | undefined>;
  createBlog(blog: Blog): Promise<Blog>;
}

export class BlogServiceClient implements BlogService {
  async getBlogs(page: number, pageSize: number): Promise<PaginatedResult<Blog>> {
    return fetchApi<PaginatedResult<Blog>>(`/api/blogs?page=${page}&pageSize=${pageSize}`);
  }

  async getBlogById(id: string): Promise<Blog | undefined> {
    return fetchApi<Blog | undefined>(`/api/blogs/${id}`);
  }

  async createBlog(blog: Blog): Promise<Blog> {
    return authenticatedFetchApi<Blog>('/api/blogs', {
      method: 'POST',
      body: JSON.stringify(blog),
    });
  }
}
