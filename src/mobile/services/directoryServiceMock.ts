import Directory from '@/models/directory';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { DirectoryFilter, DirectoryService } from './directoryService';
import { getDatabase, saveDatabase } from './localDatabase';
import { saveImageToLocalUri } from './imageStorage';

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export class MockDirectoryService implements DirectoryService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getDirectories(page: number, pageSize: number, query?: string, filters?: DirectoryFilter): Promise<PaginatedResult<Directory>> {
    const db = await this.getDb();
    const directories = (db.collections.directories as Directory[] | undefined) ?? [];
    const normalizedQuery = query?.trim().toLowerCase();
    const filtered = directories.filter((item) => {
      if (normalizedQuery && !(item.name ?? '').toLowerCase().includes(normalizedQuery)) {
        return false;
      }
      if (filters?.businessType && item.businessType !== filters.businessType) {
        return false;
      }
      if (filters?.city && item.city !== filters.city) {
        return false;
      }
      if (filters?.stateDivision && item.state !== filters.stateDivision) {
        return false;
      }
      return true;
    });
    const sorted = filtered
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return paginate(sorted, page, pageSize);
  }

  async getDirectoryById(id: string): Promise<Directory | undefined> {
    const db = await this.getDb();
    return (db.collections.directories as Directory[] | undefined)?.find((item) => item.id === id);
  }

  async createDirectory(directory: Directory): Promise<Directory> {
    const db = await this.getDb();
    const logoUrl = directory.logoUrl ? await saveImageToLocalUri(directory.logoUrl) : undefined;
    const coverImageUrl = directory.coverImageUrl ? await saveImageToLocalUri(directory.coverImageUrl) : undefined;
    const newDirectory: Directory = {
      ...directory,
      id: String(Date.now()),
      logoUrl: logoUrl || directory.logoUrl,
      coverImageUrl: coverImageUrl || directory.coverImageUrl,
      rating: directory.rating ?? 0,
      ratingCount: directory.ratingCount ?? 0,
      likesCount: directory.likesCount ?? 0,
    };
    db.collections.directories.push(newDirectory);
    await saveDatabase(db);
    return newDirectory;
  }

  async updateDirectory(directoryId: string, directory: Directory): Promise<Directory> {
    const db = await this.getDb();
    const directories = (db.collections.directories as Directory[] | undefined) ?? [];
    const existing = directories.find((item) => item.id === directoryId);
    if (!existing) throw new Error('Directory not found');

    existing.name = directory.name;
    existing.businessType = directory.businessType;
    existing.address = directory.address;
    existing.city = directory.city;
    existing.state = directory.state;
    existing.country = directory.country;
    existing.postalCode = directory.postalCode;
    existing.phone = directory.phone;
    existing.email = directory.email;
    existing.googleMapUrl = directory.googleMapUrl;

    if (directory.logoUrl) {
      existing.logoUrl = directory.logoUrl;
    }

    if (directory.coverImageUrl) {
      existing.coverImageUrl = directory.coverImageUrl;
    }

    await saveDatabase(db);
    return existing;
  }

  async deleteDirectory(directoryId: string): Promise<void> {
    const db = await this.getDb();
    const directories = (db.collections.directories as Directory[] | undefined) ?? [];
    db.collections.directories = directories.filter((item) => item.id !== directoryId);
    await saveDatabase(db);
  }
}
