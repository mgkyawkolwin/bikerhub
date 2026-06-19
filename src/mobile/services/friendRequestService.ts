import { authenticatedFetchApi } from './apiClient';

export const FriendRequestServiceToken = Symbol('FriendRequestService');

export interface FriendRequestService {
  sendFriendRequest(toProfileId: string): Promise<Response>;
  approveFriendRequest(requestId: string): Promise<Response>;
  rejectFriendRequest(requestId: string): Promise<Response>;
  getPendingFriendRequests(): Promise<Response>;
}

export class FriendRequestServiceClient implements FriendRequestService {
  async sendFriendRequest(toProfileId: string): Promise<Response> {
    return authenticatedFetchApi('/social/friend-requests', {
      method: 'POST',
      body: JSON.stringify({ toProfileId }),
    });
  }

  async approveFriendRequest(requestId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/friend-requests/${encodeURIComponent(requestId)}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectFriendRequest(requestId: string): Promise<Response> {
    return authenticatedFetchApi(`/social/friend-requests/${encodeURIComponent(requestId)}/reject`, {
      method: 'PATCH',
    });
  }

  async getPendingFriendRequests(): Promise<Response> {
    return authenticatedFetchApi('/social/friend-requests/pending');
  }
}
