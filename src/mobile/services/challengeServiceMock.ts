import type Challenge from '@/models/challenge';
import type { ChallengeService } from './challengeService';
import { getDatabase } from './localDatabase';

export class MockChallengeService implements ChallengeService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getCurrentChallenges(): Promise<Challenge[]> {
    const db = await this.getDb();
    return (db.collections.challenges as Challenge[] | undefined) ?? [];
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    const db = await this.getDb();
    return (db.collections.challenges as Challenge[] | undefined)?.find((challenge) => challenge.id === id);
  }
}
