import Message from '@/models/message';
import { PaginatedResult } from '@/models/paginatedResult';
import { authenticatedFetchApi } from './apiClient';

export const MessageServiceToken = Symbol('MessageService');

export interface MessageService {
  getMessages(page: number, pageSize: number): Promise<Response>;
  getMessageById(messageId: string): Promise<Response>;
  markMessageAsRead(messageId: string): Promise<Response>;
}

export class MessageServiceClient implements MessageService {
  async getMessages(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/api/messages?page=${page}&pageSize=${pageSize}`);
  }

  async getMessageById(messageId: string): Promise<Response> {
    return authenticatedFetchApi(`/api/messages/${encodeURIComponent(messageId)}`);
  }

  async markMessageAsRead(messageId: string): Promise<Response> {
    return authenticatedFetchApi(`/api/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'POST',
    });
  }
}
