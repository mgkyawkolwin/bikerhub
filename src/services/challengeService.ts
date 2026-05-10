import type Challenge from '@/models/challenge';

export const ChallengeServiceToken = Symbol('ChallengeService');

export interface ChallengeService {
  getCurrentChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
}
