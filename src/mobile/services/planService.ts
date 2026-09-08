import Plan from '@/models/plan';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const PlanServiceToken = Symbol('PlanService');

export interface PlanService {
  getPlans(page: number, pageSize: number, userId?: string | null): Promise<Response>;
  getPlanById(id: string): Promise<Response>;
  createPlan(plan: Plan): Promise<Response>;
  updatePlan(id: string, plan: Plan): Promise<Response>;
  deletePlan(id: string): Promise<Response>;
  updatePlanAttendance(id: string, confirmed: boolean): Promise<Response>;
  removePlanAttendance(id: string): Promise<Response>;
}

export class PlanServiceClient implements PlanService {
  async getPlans(page: number, pageSize: number, userId?: string | null): Promise<Response> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (userId) params.append('userId', userId);
    return fetchApi(`/plans?${params.toString()}`);
  }

  async getPlanById(id: string): Promise<Response> {
    return fetchApi(`/plans/${encodeURIComponent(id)}`);
  }

  async createPlan(plan: Plan): Promise<Response> {
    return authenticatedFetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async updatePlan(id: string, plan: Plan): Promise<Response> {
    return authenticatedFetchApi(`/plans/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  }

  async deletePlan(id: string): Promise<Response> {
    return authenticatedFetchApi(`/plans/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async updatePlanAttendance(id: string, confirmed: boolean): Promise<Response> {
    return authenticatedFetchApi(`/plans/${encodeURIComponent(id)}/attendance`, {
      method: 'PATCH',
      body: JSON.stringify({ confirmed }),
    });
  }

  async removePlanAttendance(id: string): Promise<Response> {
    return authenticatedFetchApi(`/plans/${encodeURIComponent(id)}/attendance`, {
      method: 'DELETE',
    });
  }
}
