import type { BikeListing } from '@/models/bikeListing';
import type { MarketplaceFilter } from '@/models/marketplaceFilter';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const MarketplaceServiceToken = Symbol('MarketplaceService');

export interface MarketplaceService {
  getListings(filter: MarketplaceFilter, page: number, pageSize: number): Promise<Response>;
  getListingById(id: string): Promise<Response>;
  createListing(listing: BikeListing): Promise<Response>;
  updateListing(id: string, listing: BikeListing): Promise<Response>;
  deleteListing(id: string): Promise<Response>;
  toggleSoldStatus(id: string): Promise<Response>;
  toggleReportStatus(id: string): Promise<Response>;
  uploadListingImage(listingId: string, file: { uri: string; name: string; type: string }): Promise<Response>;
  toggleFavorite(listingId: string): Promise<Response>;
  toggleLike(listingId: string): Promise<Response>;
  getFavorites(): Promise<Response>;
  submitRating(listingId: string, rating: number): Promise<Response>;
}

function buildMarketplaceQuery(filter: MarketplaceFilter, page: number, pageSize: number): string {
  const params = new URLSearchParams();
  if (filter.make) params.set('make', filter.make);
  if (filter.model) params.set('model', filter.model);
  if (filter.modelYear) params.set('modelYear', filter.modelYear);
  if (filter.priceMin !== undefined) params.set('priceMin', String(filter.priceMin));
  if (filter.priceMax !== undefined) params.set('priceMax', String(filter.priceMax));
  if (filter.cc) params.set('cc', filter.cc);
  if (filter.type) params.set('type', String(filter.type));
  if (filter.city) params.set('city', filter.city);
  if (filter.country) params.set('country', filter.country);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if ((filter as any).userId) params.set('userId', (filter as any).userId);
  return params.toString();
}

export class MarketplaceServiceClient implements MarketplaceService {
  async getListings(filter: MarketplaceFilter, page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/marketplace?${buildMarketplaceQuery(filter, page, pageSize)}`);
  }

  async getListingById(id: string): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(id)}`);
  }

  async createListing(listing: BikeListing): Promise<Response> {
    return authenticatedFetchApi('/marketplace', {
      method: 'POST',
      body: JSON.stringify(listing),
    });
  }

  async updateListing(id: string, listing: BikeListing): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(listing),
    });
  }

  async deleteListing(id: string): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async toggleSoldStatus(id: string): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(id)}/sold`, {
      method: 'PATCH',
    });
  }

  async toggleReportStatus(id: string): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(id)}/report`, {
      method: 'PATCH',
    });
  }

  async uploadListingImage(listingId: string, file: { uri: string; name: string; type: string }): Promise<Response> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(listingId)}/media`, {
      method: 'POST',
      body: formData,
    });
  }

  async toggleFavorite(listingId: string): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(listingId)}/favorite`, {
      method: 'POST',
    });
  }

  async toggleLike(listingId: string): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(listingId)}/like`, {
      method: 'POST',
    });
  }

  async getFavorites(): Promise<Response> {
    return authenticatedFetchApi('/marketplace/favorites');
  }

  async submitRating(listingId: string, rating: number): Promise<Response> {
    return authenticatedFetchApi(`/marketplace/${encodeURIComponent(listingId)}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }
}
