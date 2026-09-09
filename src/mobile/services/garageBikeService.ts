import type { GarageBike, GarageBikeServiceHistory } from '@/models/garageBike';
import { authenticatedFetchApi } from './apiClient';

export const GarageBikeServiceToken = Symbol('GarageBikeService');

export interface GarageBikeService {
  getGarageBikes(userId?: string): Promise<Response>;
  getGarageBikeById(id: string): Promise<Response>;
  createGarageBike(bike: GarageBike): Promise<Response>;
  updateGarageBike(id: string, bike: GarageBike): Promise<Response>;
  uploadGarageBikeImage(garageBikeId: string, file: { uri: string; name: string; type: string }): Promise<Response>;
  deleteGarageBike(id: string): Promise<Response>;
  deleteGarageBikeMedia(garageBikeId: string, mediaId: string): Promise<Response>;
  getServiceHistory(garageBikeId: string): Promise<Response>;
  createServiceHistory(garageBikeId: string, history: GarageBikeServiceHistory): Promise<Response>;
  updateServiceHistory(garageBikeId: string, historyId: string, history: GarageBikeServiceHistory): Promise<Response>;
}

function buildGarageQuery(userId?: string): string {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export class GarageBikeServiceClient implements GarageBikeService {
  async getGarageBikes(userId?: string): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes${buildGarageQuery(userId)}`);
  }

  async getGarageBikeById(id: string): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(id)}`);
  }

  async createGarageBike(bike: GarageBike): Promise<Response> {
    return authenticatedFetchApi('/garagebikes', {
      method: 'POST',
      body: JSON.stringify(bike),
    });
  }

  async updateGarageBike(id: string, bike: GarageBike): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(bike),
    });
  }

  async uploadGarageBikeImage(garageBikeId: string, file: { uri: string; name: string; type: string }): Promise<Response> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(garageBikeId)}/media`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteGarageBike(id: string): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async deleteGarageBikeMedia(garageBikeId: string, mediaId: string): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(garageBikeId)}/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
    });
  }

  async getServiceHistory(garageBikeId: string): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(garageBikeId)}/service-history`);
  }

  async createServiceHistory(garageBikeId: string, history: GarageBikeServiceHistory): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(garageBikeId)}/service-history`, {
      method: 'POST',
      body: JSON.stringify(history),
    });
  }

  async updateServiceHistory(garageBikeId: string, historyId: string, history: GarageBikeServiceHistory): Promise<Response> {
    return authenticatedFetchApi(`/garagebikes/${encodeURIComponent(garageBikeId)}/service-history/${encodeURIComponent(historyId)}`, {
      method: 'PUT',
      body: JSON.stringify(history),
    });
  }
}
