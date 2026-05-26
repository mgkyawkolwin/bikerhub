import ChatHead from '@/models/chatHead';
import ChatMessage from '@/models/chatMesage';
import { PaginatedResult } from '@/models/marketplace';
import { authenticatedFetchApi } from './apiClient';

export const ChatServiceToken = Symbol('ChatService');

export interface IChatService {
  getChatHeads(page: number, pageSize: number): Promise<PaginatedResult<ChatHead>>;
  getChatMessages(friendId: string): Promise<PaginatedResult<ChatMessage>>;
  sendChatMessage(receiverId: string, textMessage: string): Promise<ChatMessage>;
  markChatMessageAsRead(messageId: string): Promise<void>;
}

export class ChatServiceClient implements IChatService {
  async getChatHeads(page: number, pageSize: number): Promise<PaginatedResult<ChatHead>> {
    return authenticatedFetchApi<PaginatedResult<ChatHead>>(`/api/chat/heads?page=${page}&pageSize=${pageSize}`);
  }

  async getChatMessages(friendId: string): Promise<PaginatedResult<ChatMessage>> {
    return authenticatedFetchApi<PaginatedResult<ChatMessage>>(`/api/chat/messages?friendId=${encodeURIComponent(friendId)}`);
  }

  async sendChatMessage(receiverId: string, textMessage: string): Promise<ChatMessage> {
    return authenticatedFetchApi<ChatMessage>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, textMessage }),
    });
  }

  async markChatMessageAsRead(messageId: string): Promise<void> {
    await authenticatedFetchApi<void>(`/api/chat/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'POST',
    });
  }
}
