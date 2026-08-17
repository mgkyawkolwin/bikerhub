import type { StolenBikeReport } from '@/models/stolenBikeReport';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const StolenBikeServiceToken = Symbol('StolenBikeService');

export interface StolenBikeService {
  createReport(report: StolenBikeReport): Promise<Response>;
  getReports(): Promise<Response>;
  getReportById(id: string): Promise<Response>;
  uploadListingImage(listingId: string, file: { uri: string; name: string; type: string }): Promise<Response>;
}

export class StolenBikeServiceClient implements StolenBikeService {
  async createReport(report: StolenBikeReport): Promise<Response> {
    return authenticatedFetchApi('/stolenbikes', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async getReports(): Promise<Response> {
    return fetchApi('/stolenbikes');
  }

  async getReportById(id: string): Promise<Response> {
    return fetchApi(`/stolenbikes/${encodeURIComponent(id)}`);
  }

  async uploadListingImage(listingId: string, file: { uri: string; name: string; type: string }): Promise<Response> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return authenticatedFetchApi(`/stolenbikes/${encodeURIComponent(listingId)}/media`, {
      method: 'POST',
      body: formData,
    });
  }
}
