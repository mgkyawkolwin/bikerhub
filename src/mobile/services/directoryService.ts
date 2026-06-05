import Directory from '@/models/directory';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const DirectoryServiceToken = Symbol('DirectoryService');

export type DirectoryFilter = {
  businessType?: string;
  city?: string;
  stateDivision?: string;
};

export interface DirectoryService {
  getDirectories(page: number, pageSize: number, query?: string, filters?: DirectoryFilter): Promise<Response>;
  getDirectoryById(id: string): Promise<Response>;
  createDirectory(directory: Directory): Promise<Response>;
}

function buildDirectoryQuery(page: number, pageSize: number, query?: string, filters?: DirectoryFilter): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (query) params.set('query', query);
  if (filters?.businessType) params.set('businessType', filters.businessType);
  if (filters?.city) params.set('city', filters.city);
  if (filters?.stateDivision) params.set('stateDivision', filters.stateDivision);
  return params.toString();
}

export class DirectoryServiceClient implements DirectoryService {
  async getDirectories(page: number, pageSize: number, query?: string, filters?: DirectoryFilter): Promise<Response> {
    return fetchApi(`/api/directories?${buildDirectoryQuery(page, pageSize, query, filters)}`);
  }

  async getDirectoryById(id: string): Promise<Response> {
    return fetchApi(`/api/directories/${encodeURIComponent(id)}`);
  }

  async createDirectory(directory: Directory): Promise<Response> {
    return authenticatedFetchApi('/api/directories', {
      method: 'POST',
      body: JSON.stringify(directory),
    });
  }
}
