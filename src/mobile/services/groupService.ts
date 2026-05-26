import type Group from '@/models/group';
import { fetchApi, authenticatedFetchApi } from './apiClient';

export const GroupServiceToken = Symbol('GroupService');

export interface GroupService {
  getGroups(): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  createGroup(group: Group): Promise<Group>;
}

export class GroupServiceClient implements GroupService {
  async getGroups(): Promise<Group[]> {
    return fetchApi<Group[]>('/api/groups');
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    return fetchApi<Group | undefined>(`/api/groups/${encodeURIComponent(id)}`);
  }

  async createGroup(group: Group): Promise<Group> {
    return authenticatedFetchApi<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }
}
