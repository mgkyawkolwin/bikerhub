import Message from '@/models/message';
import { PaginatedResult } from '@/models/paginatedResult';
import { authenticatedFetchApi } from './apiClient';

export const MessageServiceToken = Symbol('MessageService');

export interface MessageService {
  getMessages(page: number, pageSize: number): Promise<PaginatedResult<Message>>;
  getMessageById(messageId: string): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
}

export class MessageServiceClient implements MessageService {
  async getMessages(page: number, pageSize: number): Promise<PaginatedResult<Message>> {
    return authenticatedFetchApi<PaginatedResult<Message>>(`/api/messages?page=${page}&pageSize=${pageSize}`);
  }

  async getMessageById(messageId: string): Promise<Message> {
    return authenticatedFetchApi<Message>(`/api/messages/${encodeURIComponent(messageId)}`);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await authenticatedFetchApi<void>(`/api/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'POST',
    });
  }
}
