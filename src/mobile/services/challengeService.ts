import { authenticatedFetchApi, fetchApi } from './apiClient';

export const ChallengeServiceToken = Symbol('ChallengeService');

export interface ChallengeService {
  getPastChallenges(): Promise<Response>;
  getCurrentChallenges(): Promise<Response>;
  getFutureChallenges(): Promise<Response>;
  getChallengeById(id: string): Promise<Response>;
  joinChallenge(id: string): Promise<Response>;
  leaveChallenge(id: string): Promise<Response>;
}

export class ChallengeServiceClient implements ChallengeService {
  async getPastChallenges(): Promise<Response> {
    return authenticatedFetchApi('/challenges/past');
  }

  async getCurrentChallenges(): Promise<Response> {
    return authenticatedFetchApi('/challenges/current');
  }

  async getFutureChallenges(): Promise<Response> {
    return authenticatedFetchApi('/challenges/future');
  }

  async getChallengeById(id: string): Promise<Response> {
    return authenticatedFetchApi(`/challenges/${id}`);
  }

  async joinChallenge(id: string): Promise<Response> {
    return authenticatedFetchApi(`/challenges/${id}/join`, {
      method: 'GET',
    });
  }

  async leaveChallenge(id: string): Promise<Response> {
    return authenticatedFetchApi(`/challenges/${id}/leave`, {
      method: 'GET',
    });
  }
}
