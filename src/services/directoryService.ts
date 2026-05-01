import Directory from '@/models/directory';
import type { PaginatedResult } from '@/models/paginatedResult';

export const DirectoryServiceToken = Symbol('DirectoryService');

export interface DirectoryService {
  getDirectories(page: number, pageSize: number): Promise<PaginatedResult<Directory>>;
  getDirectoryById(id: string): Promise<Directory | undefined>;
}
