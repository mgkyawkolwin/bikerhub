import Plan from '@/models/plan';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const PlanServiceToken = Symbol('PlanService');

export interface PlanService {
  getPlans(page: number, pageSize: number): Promise<Response>;
  getPlanById(id: string): Promise<Response>;
  createPlan(plan: Plan): Promise<Response>;
  updatePlan(id: string, plan: Plan): Promise<Response>;
  updatePlanAttendance(id: string, confirmed: boolean): Promise<Response>;
}

export class PlanServiceClient implements PlanService {
  async getPlans(page: number, pageSize: number): Promise<Response> {
    return fetchApi(`/plans?page=${page}&pageSize=${pageSize}`);
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

  async updatePlanAttendance(id: string, confirmed: boolean): Promise<Response> {
    return authenticatedFetchApi(`/plans/${encodeURIComponent(id)}/attendance`, {
      method: 'PATCH',
      body: JSON.stringify({ confirmed }),
    });
  }
}
