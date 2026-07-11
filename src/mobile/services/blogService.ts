import Blog from '@/models/blog';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const BlogServiceToken = Symbol('BlogService');

export interface BlogService {
  getBlogs(page: number, pageSize: number): Promise<Response>;
  getBlogById(id: string): Promise<Response>;
  createBlog(blog: Blog): Promise<Response>;
}

export class BlogServiceClient implements BlogService {
  async getBlogs(page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/blogs?page=${page}&pageSize=${pageSize}`);
  }

  async getBlogById(id: string): Promise<Response> {
    return fetchApi(`/blogs/${id}`);
  }

  async createBlog(blog: Blog): Promise<Response> {
    return authenticatedFetchApi('/blogs', {
      method: 'POST',
      body: JSON.stringify(blog),
    });
  }
}
