import { fetchApi } from './apiClient';

export const ConfigServiceToken = Symbol('ConfigService');

export interface ConfigService {
  getBusinessTypes(): Promise<Response>;
  getCities(): Promise<Response>;
  getStateDivisions(): Promise<Response>;
}

export class ConfigServiceClient implements ConfigService {
  async getBusinessTypes(): Promise<Response> {
    return fetchApi('/api/config/business-types');
  }

  async getCities(): Promise<Response> {
    return fetchApi('/api/config/cities');
  }

  async getStateDivisions(): Promise<Response> {
    return fetchApi('/api/config/state-divisions');
  }
}
