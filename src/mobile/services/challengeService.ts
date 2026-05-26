import type Challenge from '@/models/challenge';
import { fetchApi } from './apiClient';

export const ChallengeServiceToken = Symbol('ChallengeService');

export interface ChallengeService {
  getCurrentChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
}

export class ChallengeServiceClient implements ChallengeService {
  async getCurrentChallenges(): Promise<Challenge[]> {
    return fetchApi<Challenge[]>('/api/challenges/current');
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    return fetchApi<Challenge | undefined>(`/api/challenges/${id}`);
  }
}
