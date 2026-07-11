import type Group from '@/models/group';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const GroupServiceToken = Symbol('GroupService');

export interface GroupService {
  getGroups(): Promise<Response>;
  getGroupById(id: string): Promise<Response>;
  createGroup(group: Group): Promise<Response>;
}

export class GroupServiceClient implements GroupService {
  async getGroups(): Promise<Response> {
    return fetchApi('/groups');
  }

  async getGroupById(id: string): Promise<Response> {
    return fetchApi(`/groups/${encodeURIComponent(id)}`);
  }

  async createGroup(group: Group): Promise<Response> {
    return authenticatedFetchApi('/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }
}
