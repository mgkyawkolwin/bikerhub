import Ride from '@/models/ride';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const RideServiceToken = Symbol('RideService');

export interface RideService {
  getRides(page: number, pageSize: number): Promise<Response>;
  getRideById(id: string): Promise<Response>;
  createRide(ride: Ride): Promise<Response>;
  updateRide(id: string, ride: Ride): Promise<Response>;
  updateRideInfo(id: string, info: { name?: string; description?: string; bike?: string }): Promise<Response>;
  uploadRideImage(rideId: string, file: { uri: string; name: string; type: string }): Promise<Response>;
  deleteRideImage(rideId: string, mediaId: string): Promise<Response>;
}

export class RideServiceClient implements RideService {
  async getRides(page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/rides?page=${page}&pageSize=${pageSize}`);
  }

  async getRideById(id: string): Promise<Response> {
    return fetchApi(`/rides/${encodeURIComponent(id)}`);
  }

  async createRide(ride: Ride): Promise<Response> {
    console.log('Creating ride with data:', ride);
    return authenticatedFetchApi('/rides', {
      method: 'POST',
      body: JSON.stringify(ride),
    });
  }

  async updateRide(id: string, ride: Ride): Promise<Response> {
    return authenticatedFetchApi(`/rides/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(ride),
    });
  }

  async updateRideInfo(id: string, info: { name?: string; description?: string; bike?: string }): Promise<Response> {
    return authenticatedFetchApi(`/rides/${encodeURIComponent(id)}/info`, {
      method: 'PATCH',
      body: JSON.stringify(info),
    });
  }

  async uploadRideImage(rideId: string, file: { uri: string; name: string; type: string }): Promise<Response> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return authenticatedFetchApi(`/rides/${encodeURIComponent(rideId)}/media`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteRideImage(rideId: string, mediaId: string): Promise<Response> {
    return authenticatedFetchApi(`/rides/${encodeURIComponent(rideId)}/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
    });
  }
}
