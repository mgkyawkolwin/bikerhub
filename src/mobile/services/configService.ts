import { fetchApi } from './apiClient';

export const ConfigServiceToken = Symbol('ConfigService');

export interface ConfigService {
  getBusinessTypes(): Promise<string[]>;
  getCities(): Promise<string[]>;
  getStateDivisions(): Promise<string[]>;
}

export class ConfigServiceClient implements ConfigService {
  async getBusinessTypes(): Promise<string[]> {
    return fetchApi<string[]>('/api/config/business-types');
  }

  async getCities(): Promise<string[]> {
    return fetchApi<string[]>('/api/config/cities');
  }

  async getStateDivisions(): Promise<string[]> {
    return fetchApi<string[]>('/api/config/state-divisions');
  }
}
