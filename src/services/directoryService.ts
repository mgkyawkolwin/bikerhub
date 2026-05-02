import Directory from '@/models/directory';
import type { PaginatedResult } from '@/models/paginatedResult';

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
