import ChatHead from '@/models/chatHead';
import ChatMessage from '@/models/chatMesage';
import { PaginatedResult } from '@/models/marketplace';
import { authenticatedFetchApi, ApiResponse } from './apiClient';

export const ChatServiceToken = Symbol('ChatService');

export interface IChatService {
  getChatHeads(page: number, pageSize: number): Promise<PaginatedResult<ChatHead>>;
  getChatMessages(friendId: string): Promise<PaginatedResult<ChatMessage>>;
  sendChatMessage(receiverId: string, textMessage: string): Promise<ChatMessage>;
  sendChatMediaMessage(receiverId: string, file: { uri: string; name: string; type: string }): Promise<ChatMessage>;
  markChatMessageAsRead(messageId: string): Promise<void>;
}

export class ChatServiceClient implements IChatService {
  async getChatHeads(page: number, pageSize: number): Promise<PaginatedResult<ChatHead>> {
    const response = await authenticatedFetchApi(`/chat/heads?page=${page}&pageSize=${pageSize}`);
    const result = (await response.json()) as ApiResponse<PaginatedResult<ChatHead>>;
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Unable to load chat threads.');
    }
    return result.data ?? new PaginatedResult<ChatHead>([], page, pageSize, 0);
  }

  async getChatMessages(friendId: string): Promise<PaginatedResult<ChatMessage>> {
    const response = await authenticatedFetchApi(`/chat/messages?friendId=${encodeURIComponent(friendId)}`);
    const result = (await response.json()) as ApiResponse<PaginatedResult<ChatMessage>>;
    if (!response.ok) {
      throw new Error(`${response.status} - ${response.statusText} : Invalid server response. Please try again.`);
    }
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data ?? new PaginatedResult<ChatMessage>([], 1, 1, 0);
  }

  async sendChatMessage(receiverId: string, textMessage: string): Promise<ChatMessage> {
    const response = await authenticatedFetchApi('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, messageType: 'Text', textMessage }),
    });
    const result = (await response.json()) as ApiResponse<ChatMessage>;
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Unable to send message.');
    }
    return result.data ?? new ChatMessage();
  }

  async sendChatMediaMessage(receiverId: string, file: { uri: string; name: string; type: string }): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append('ReceiverId', receiverId);
    formData.append('File', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await authenticatedFetchApi('/chat/messages/media', {
      method: 'POST',
      body: formData,
    });

    const result = (await response.json()) as ApiResponse<ChatMessage>;
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Unable to send media message.');
    }

    return result.data ?? new ChatMessage();
  }

  async markChatMessageAsRead(messageId: string): Promise<void> {
    const response = await authenticatedFetchApi(`/chat/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Unable to mark message as read.');
    }
  }
}
