import Route from '@/models/route';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const RouteServiceToken = Symbol('RouteService');

export interface RouteService {
  getRoutes(page: number, pageSize: number): Promise<Response>;
  getRouteById(id: string): Promise<Response>;
  createRoute(route: Route): Promise<Response>;
}

export class RouteServiceClient implements RouteService {
  async getRoutes(page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/routes?page=${page}&pageSize=${pageSize}`);
  }

  async getRouteById(id: string): Promise<Response> {
    return fetchApi(`/routes/${encodeURIComponent(id)}`);
  }

  async createRoute(route: Route): Promise<Response> {
    return authenticatedFetchApi('/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    });
  }
}
