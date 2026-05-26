import type { ConfigService } from './configService';
import { getDatabase } from './localDatabase';

export class MockConfigService implements ConfigService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getBusinessTypes(): Promise<string[]> {
    const db = await this.getDb();
    return (db.collections.config?.businessTypes as string[] | undefined) ?? [];
  }

  async getCities(): Promise<string[]> {
    const db = await this.getDb();
    return (db.collections.config?.cities as string[] | undefined) ?? [];
  }

  async getStateDivisions(): Promise<string[]> {
    const db = await this.getDb();
    return (db.collections.config?.stateDivisions as string[] | undefined) ?? [];
  }
}
