import Route from '@/models/route';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { RouteService } from './routeService';
import { getDatabase, saveDatabase } from './localDatabase';

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export class MockRouteService implements RouteService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getRoutes(page: number, pageSize: number): Promise<PaginatedResult<Route>> {
    const db = await this.getDb();
    const routes = (db.collections.routes as Route[] | undefined) ?? [];
    const sorted = routes.slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return paginate(sorted, page, pageSize);
  }

  async getRouteById(id: string): Promise<Response> {
    const db = await this.getDb();
    const route = (db.collections.routes as Route[] | undefined)?.find((item) => item.id === id);
    const status = route ? 200 : 404;
    const body = JSON.stringify({ Success: true, Data: route ?? null });
    return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
  }

  async createRoute(route: Route): Promise<Response> {
    const db = await this.getDb();
    const newRoute: Route = {
      ...route,
      id: String(Date.now()),
    };
    db.collections.routes.push(newRoute);
    await saveDatabase(db);
    const body = JSON.stringify({ Success: true, Data: newRoute });
    return new Response(body, { status: 201, headers: { 'Content-Type': 'application/json' } });
  }

  async updateRoute(id: string, route: Route): Promise<Response> {
    const db = await this.getDb();
    const routes = (db.collections.routes as Route[] | undefined) ?? [];
    const index = routes.findIndex((item) => item.id === id);
    if (index === -1) {
      const body = JSON.stringify({ Success: false, Message: 'Route not found.' });
      return new Response(body, { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const existing = routes[index];
    const updatedRoute: Route = {
      ...existing,
      ...route,
      id,
    };

    routes[index] = updatedRoute;
    await saveDatabase(db);

    const body = JSON.stringify({ Success: true, Data: updatedRoute });
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
