import Message from '@/models/message';
import { PaginatedResult } from '@/models/paginatedResult';
import { authenticatedFetchApi } from './apiClient';

export const MessageServiceToken = Symbol('MessageService');

export interface MessageService {
  getMessages(page: number, pageSize: number): Promise<Response>;
  getMessageById(messageId: string): Promise<Response>;
  markMessageAsRead(messageId: string): Promise<Response>;
  markAllMessagesAsRead(): Promise<Response>;
  markMessageAsUnread(messageId: string): Promise<Response>;
  hasUnreadMessages(): Promise<Response>;
}

export class MessageServiceClient implements MessageService {
  async getMessages(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/messages?page=${page}&pageSize=${pageSize}`);
  }

  async getMessageById(messageId: string): Promise<Response> {
    return authenticatedFetchApi(`/messages/${encodeURIComponent(messageId)}`);
  }

  async markMessageAsRead(messageId: string): Promise<Response> {
    return authenticatedFetchApi(`/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'POST',
    });
  }

  async markAllMessagesAsRead(): Promise<Response> {
    return authenticatedFetchApi('/messages/read/all', {
      method: 'PATCH',
    });
  }

  async markMessageAsUnread(messageId: string): Promise<Response> {
    return authenticatedFetchApi(`/messages/${encodeURIComponent(messageId)}/unread`, {
      method: 'PATCH',
    });
  }

  async hasUnreadMessages(): Promise<Response> {
    return authenticatedFetchApi('/messages/unread');
  }
}
