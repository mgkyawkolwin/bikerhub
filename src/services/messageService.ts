export const MessageServiceToken = Symbol('MessageService');

export type MessageItem = {
  id: string;
  title: string;
  preview: string;
  time: string;
  unread: number;
};

export type MessageDetail = {
  id: string;
  title: string;
  body: string;
  time: string;
  sender: string;
  status: 'sent' | 'seen';
};

export type MessagePage = {
  items: MessageItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export interface MessageService {
  getMessages(page: number, pageSize: number): Promise<MessagePage>;
  getMessageById(messageId: string): Promise<MessageDetail | undefined>;
  markAsRead(messageId: string): Promise<void>;
}
