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

  async getRouteById(id: string): Promise<Route | undefined> {
    const db = await this.getDb();
    return (db.collections.routes as Route[] | undefined)?.find((item) => item.id === id);
  }

  async createRoute(route: Route): Promise<Route> {
    const db = await this.getDb();
    const newRoute: Route = {
      ...route,
      id: String(Date.now()),
    };
    db.collections.routes.push(newRoute);
    await saveDatabase(db);
    return newRoute;
  }
}
