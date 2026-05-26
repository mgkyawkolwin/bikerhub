import Route from '@/models/route';
import type { PaginatedResult } from '@/models/paginatedResult';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const RouteServiceToken = Symbol('RouteService');

export interface RouteService {
  getRoutes(page: number, pageSize: number): Promise<PaginatedResult<Route>>;
  getRouteById(id: string): Promise<Route | undefined>;
  createRoute(route: Route): Promise<Route>;
}

export class RouteServiceClient implements RouteService {
  async getRoutes(page: number, pageSize: number): Promise<PaginatedResult<Route>> {
    return fetchApi<PaginatedResult<Route>>(`/api/routes?page=${page}&pageSize=${pageSize}`);
  }

  async getRouteById(id: string): Promise<Route | undefined> {
    return fetchApi<Route | undefined>(`/api/routes/${encodeURIComponent(id)}`);
  }

  async createRoute(route: Route): Promise<Route> {
    return authenticatedFetchApi<Route>('/api/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    });
  }
}
