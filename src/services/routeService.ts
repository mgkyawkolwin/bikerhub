import Route from '@/models/route';
import type { PaginatedResult } from '@/models/paginatedResult';

export const RouteServiceToken = Symbol('RouteService');

export interface RouteService {
  getRoutes(page: number, pageSize: number): Promise<PaginatedResult<Route>>;
  getRouteById(id: string): Promise<Route | undefined>;
  createRoute(route: Route): Promise<Route>;
}
