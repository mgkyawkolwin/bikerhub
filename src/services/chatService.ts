export const ChatServiceToken = Symbol('ChatService');

export type ChatThread = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  sender: 'me' | 'other';
  text: string;
  timestamp: string;
  type?: 'text' | 'image' | 'video' | 'file' | 'audio';
  status?: 'sent' | 'seen';
};

export type ChatPage = {
  items: ChatThread[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export interface ChatService {
  getThreads(page: number, pageSize: number): Promise<ChatPage>;
  getMessages(threadId: string): Promise<ChatMessage[]>;
  sendMessage(threadId: string, text: string): Promise<ChatMessage>;
}
