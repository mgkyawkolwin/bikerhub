import type { StolenBikeReport } from '@/models/stolenBikeReport';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const StolenBikeServiceToken = Symbol('StolenBikeService');

export interface StolenBikeService {
  createReport(report: StolenBikeReport): Promise<Response>;
  getReports(): Promise<Response>;
  getReportById(id: string): Promise<Response>;
}

export class StolenBikeServiceClient implements StolenBikeService {
  async createReport(report: StolenBikeReport): Promise<Response> {
    return authenticatedFetchApi('/stolen-bikes', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async getReports(): Promise<Response> {
    return fetchApi('/stolen-bikes');
  }

  async getReportById(id: string): Promise<Response> {
    return fetchApi(`/stolen-bikes/${encodeURIComponent(id)}`);
  }
}
