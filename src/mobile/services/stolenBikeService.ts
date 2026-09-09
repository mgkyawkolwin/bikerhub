import type { StolenBikeReport } from '@/models/stolenBikeReport';
import type { MarketplaceFilter } from '@/models/marketplace';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const StolenBikeServiceToken = Symbol('StolenBikeService');

export interface StolenBikeService {
  createReport(report: StolenBikeReport): Promise<Response>;
  getReports(filter: MarketplaceFilter, page: number, pageSize: number): Promise<Response>;
  getReportById(id: string): Promise<Response>;
  deleteReport(id: string): Promise<Response>;
  uploadListingImage(listingId: string, file: { uri: string; name: string; type: string }): Promise<Response>;
}

function buildStolenBikeQuery(filter: MarketplaceFilter, page: number, pageSize: number): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (filter.make) params.set('make', filter.make);
  if (filter.model) params.set('model', filter.model);
  if (filter.modelYear) params.set('modelYear', filter.modelYear);
  if (filter.priceMin !== undefined) params.set('priceMin', String(filter.priceMin));
  if (filter.priceMax !== undefined) params.set('priceMax', String(filter.priceMax));
  if (filter.cc) params.set('cc', filter.cc);
  if (filter.type) params.set('type', String(filter.type));
  if (filter.city) params.set('city', filter.city);
  if (filter.country) params.set('country', filter.country);

  return params.toString();
}

export class StolenBikeServiceClient implements StolenBikeService {
  async createReport(report: StolenBikeReport): Promise<Response> {
    return authenticatedFetchApi('/stolenbikes', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async getReports(filter: MarketplaceFilter, page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/stolenbikes?${buildStolenBikeQuery(filter, page, pageSize)}`);
  }

  async getReportById(id: string): Promise<Response> {
    return fetchApi(`/stolenbikes/${encodeURIComponent(id)}`);
  }

  async deleteReport(id: string): Promise<Response> {
    return authenticatedFetchApi(`/stolenbikes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
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
