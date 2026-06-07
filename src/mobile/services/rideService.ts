import Ride from '@/models/ride';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const RideServiceToken = Symbol('RideService');

export interface RideService {
  getRides(page: number, pageSize: number): Promise<Response>;
  getRideById(id: string): Promise<Response>;
  createRide(ride: Ride): Promise<Response>;
  updateRide(id: string, ride: Ride): Promise<Response>;
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
}
