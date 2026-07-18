import type Challenge from '@/models/challenge';
import { authenticatedFetchApi, fetchApi } from './apiClient';

export const ChallengeServiceToken = Symbol('ChallengeService');

export interface ChallengeService {
  getPastChallenges(): Promise<Response>;
  getCurrentChallenges(): Promise<Response>;
  getFutureChallenges(): Promise<Response>;
  getChallengeById(id: string): Promise<Response>;
  joinChallenge(id: string): Promise<Response>;
}

export class ChallengeServiceClient implements ChallengeService {
  async getPastChallenges(): Promise<Response> {
    return fetchApi('/challenges/past');
  }

  async getCurrentChallenges(): Promise<Response> {
    return fetchApi('/challenges/current');
  }

  async getFutureChallenges(): Promise<Response> {
    return fetchApi('/challenges/future');
  }

  async getChallengeById(id: string): Promise<Response> {
    return fetchApi(`/challenges/${id}`);
  }

  async joinChallenge(id: string): Promise<Response> {
    return authenticatedFetchApi(`/challenges/${id}/join`, {
      method: 'POST',
    });
  }
}
