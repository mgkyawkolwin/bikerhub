import Message from "@/models/message";
import { PaginatedResult } from "@/models/paginatedResult";

export const MessageServiceToken = Symbol('MessageService');

export interface MessageService {
  getMessages(page: number, pageSize: number): Promise<PaginatedResult<Message>>;
  getMessageById(messageId: string): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
}
