import type Challenge from '@/models/challenge';
import { fetchApi } from './apiClient';

export const ChallengeServiceToken = Symbol('ChallengeService');

export interface ChallengeService {
  getCurrentChallenges(): Promise<Response>;
  getChallengeById(id: string): Promise<Response>;
}

export class ChallengeServiceClient implements ChallengeService {
  async getCurrentChallenges(): Promise<Response> {
    return fetchApi('/api/challenges/current');
  }

  async getChallengeById(id: string): Promise<Response> {
    return fetchApi(`/api/challenges/${id}`);
  }
}
