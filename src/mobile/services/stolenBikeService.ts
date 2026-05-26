import type { StolenBikeReport } from '@/models/stolenBikeReport';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const StolenBikeServiceToken = Symbol('StolenBikeService');

export interface StolenBikeService {
  createReport(report: StolenBikeReport): Promise<StolenBikeReport>;
  getReports(): Promise<StolenBikeReport[]>;
  getReportById(id: string): Promise<StolenBikeReport | undefined>;
}

export class StolenBikeServiceClient implements StolenBikeService {
  async createReport(report: StolenBikeReport): Promise<StolenBikeReport> {
    return authenticatedFetchApi<StolenBikeReport>('/api/stolen-bikes', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async getReports(): Promise<StolenBikeReport[]> {
    return fetchApi<StolenBikeReport[]>('/api/stolen-bikes');
  }

  async getReportById(id: string): Promise<StolenBikeReport | undefined> {
    return fetchApi<StolenBikeReport | undefined>(`/api/stolen-bikes/${encodeURIComponent(id)}`);
  }
}
