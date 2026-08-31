import Route from '@/models/route';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const RouteServiceToken = Symbol('RouteService');

export interface RouteService {
  getRoutes(page: number, pageSize: number): Promise<Response>;
  getRouteById(id: string): Promise<Response>;
  calculateRoute(waypoints: { latitude: number; longitude: number }[]): Promise<Response>;
  getStaticMapUrl(request: { waypoints: { latitude: number; longitude: number }[]; encodedPolyline?: string; width?: number; height?: number; scale?: number }): Promise<Response>;
  createRoute(route: Route): Promise<Response>;
  updateRoute(id: string, route: Route): Promise<Response>;
}

export class RouteServiceClient implements RouteService {
  async getRoutes(page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/routes?page=${page}&pageSize=${pageSize}`);
  }

  async getRouteById(id: string): Promise<Response> {
    return fetchApi(`/routes/${encodeURIComponent(id)}`);
  }

  async calculateRoute(waypoints: { latitude: number; longitude: number }[]): Promise<Response> {
    return fetchApi('/routes/calculate', {
      method: 'POST',
      body: JSON.stringify({ waypoints }),
    });
  }

  async getStaticMapUrl(request: { waypoints: { latitude: number; longitude: number }[]; encodedPolyline?: string; width?: number; height?: number; scale?: number }): Promise<Response> {
    return fetchApi('/routes/static-map-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createRoute(route: Route): Promise<Response> {
    return authenticatedFetchApi('/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    });
  }

  async updateRoute(id: string, route: Route): Promise<Response> {
    return authenticatedFetchApi(`/routes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(route),
    });
  }
}
