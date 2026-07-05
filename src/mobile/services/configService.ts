import { fetchApi } from './apiClient';

export const ConfigServiceToken = Symbol('ConfigService');

export interface ConfigService {
  getBusinessTypes(): Promise<Response>;
  getCities(): Promise<Response>;
  getStateDivisions(): Promise<Response>;
}

export class ConfigServiceClient implements ConfigService {
  async getBusinessTypes(): Promise<Response> {
    return fetchApi(`/lookup?category=${encodeURIComponent('BUSINESS TYPE')}`);
  }

  async getCities(): Promise<Response> {
    return fetchApi(`/lookup?category=${encodeURIComponent('CITY')}`);
  }

  async getStateDivisions(): Promise<Response> {
    return fetchApi(`/lookup?category=${encodeURIComponent('STATE DIVISION')}`);
  }
}
