import type Group from '@/models/group';
import type { GroupService } from './groupService';
import { getDatabase, saveDatabase } from './localDatabase';

export class MockGroupService implements GroupService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getGroups(): Promise<Group[]> {
    const db = await this.getDb();
    return (db.collections.groups as Group[] | undefined) ?? [];
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    const db = await this.getDb();
    return (db.collections.groups as Group[] | undefined)?.find((group) => group.id === id);
  }

  async createGroup(group: Group): Promise<Group> {
    const db = await this.getDb();
    const groups = (db.collections.groups as Group[] | undefined) ?? [];
    const newGroups = [group, ...groups];
    db.collections.groups = newGroups;
    await saveDatabase(db);
    return group;
  }
}
