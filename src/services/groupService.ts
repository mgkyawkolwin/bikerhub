import type Group from '@/models/group';

export const GroupServiceToken = Symbol('GroupService');

export interface GroupService {
  getGroups(): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  createGroup(group: Group): Promise<Group>;
}
