import ChatHead from "@/models/chatHead";
import ChatMessage from "@/models/chatMesage";
import { PaginatedResult } from "@/models/marketplace";

export const ChatServiceToken = Symbol('ChatService');

export interface IChatService {
  getChatHeads(page: number, pageSize: number): Promise<PaginatedResult<ChatHead>>;
  getChatMessages(friendId: string): Promise<PaginatedResult<ChatMessage>>;
  sendChatMessage(receiverId: string, textMessage: string): Promise<ChatMessage>;
  markChatMessageAsRead(messageId: string): Promise<void>;
}
