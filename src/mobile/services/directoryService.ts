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
  getDirectories(page: number, pageSize: number, query?: string, filters?: DirectoryFilter): Promise<PaginatedResult<Directory>>;
  getDirectoryById(id: string): Promise<Directory | undefined>;
  createDirectory(directory: Directory): Promise<Directory>;
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
  async getDirectories(page: number, pageSize: number, query?: string, filters?: DirectoryFilter): Promise<PaginatedResult<Directory>> {
    return fetchApi<PaginatedResult<Directory>>(`/api/directories?${buildDirectoryQuery(page, pageSize, query, filters)}`);
  }

  async getDirectoryById(id: string): Promise<Directory | undefined> {
    return fetchApi<Directory | undefined>(`/api/directories/${encodeURIComponent(id)}`);
  }

  async createDirectory(directory: Directory): Promise<Directory> {
    return authenticatedFetchApi<Directory>('/api/directories', {
      method: 'POST',
      body: JSON.stringify(directory),
    });
  }
}
