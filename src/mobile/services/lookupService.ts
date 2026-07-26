import { authenticatedFetchApi } from './apiClient';

export const LookupServiceToken = Symbol('LookupService');

export interface LookupService {
  getLookup(category: string, code: string, value: string): Promise<Response>;
}

export class LookupServiceClient implements LookupService {
  async getLookup(category: string, code: string, value: string): Promise<Response> {
    return authenticatedFetchApi(`/lookup/?category=${encodeURIComponent(category)}&code=${encodeURIComponent(code)}&value=${encodeURIComponent(value)}`);
  }
}
