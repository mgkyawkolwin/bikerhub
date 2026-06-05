import ChatHead from '@/models/chatHead';
import ChatMessage from '@/models/chatMesage';
import { PaginatedResult } from '@/models/marketplace';
import { authenticatedFetchApi } from './apiClient';

export const ChatServiceToken = Symbol('ChatService');

export interface IChatService {
  getChatHeads(page: number, pageSize: number): Promise<Response>;
  getChatMessages(friendId: string): Promise<Response>;
  sendChatMessage(receiverId: string, textMessage: string): Promise<Response>;
  markChatMessageAsRead(messageId: string): Promise<Response>;
}

export class ChatServiceClient implements IChatService {
  async getChatHeads(page: number, pageSize: number): Promise<Response> {
    return authenticatedFetchApi(`/api/chat/heads?page=${page}&pageSize=${pageSize}`);
  }

  async getChatMessages(friendId: string): Promise<Response> {
    return authenticatedFetchApi(`/api/chat/messages?friendId=${encodeURIComponent(friendId)}`);
  }

  async sendChatMessage(receiverId: string, textMessage: string): Promise<Response> {
    return authenticatedFetchApi('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, textMessage }),
    });
  }

  async markChatMessageAsRead(messageId: string): Promise<Response> {
    return authenticatedFetchApi(`/api/chat/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'POST',
    });
  }
}
