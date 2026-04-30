import type ChatHead from '@/models/chatHead';
import ChatMessage from '@/models/chatMesage';
import { PaginatedResult } from '@/models/paginatedResult';
import type { IChatService } from './chatService';
import { getDatabase, saveDatabase } from './localDatabase';

export class MockChatService implements IChatService {
  private dbPromise = getDatabase();
  private readonly currentUserId = '00000000-0000-0000-0000-000000000000';

  private async getDb() {
    return this.dbPromise;
  }

  async getChatHeads(page: number, pageSize: number): Promise<PaginatedResult<ChatHead>> {
    const db = await this.getDb();
    console.log(db);
    const heads = (db.collections.chatHeads as ChatHead[] | undefined) ?? [];
    console.log(heads);

    const sortedHeads = heads
      .slice()
      .sort((a, b) => new Date(b.messageDateTimeUTC ?? '').getTime() - new Date(a.messageDateTimeUTC ?? '').getTime())
      .map((head) => ({
        id: head.id,
        textMessage: head.textMessage,
        messageDateTimeUTC: head.messageDateTimeUTC,
        unreadCount: head.unreadCount ?? 0,
        friendId: head.friendId,
        friendName: head.friendName,
        friendProfilePictureUrl: head.friendProfilePictureUrl,
      }));

    const total = sortedHeads.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const rows = sortedHeads.slice(offset, offset + pageSize);
    return {
      items: rows,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  async getChatMessages(friendId: string): Promise<PaginatedResult<ChatMessage>> {
    console.log(friendId);
    const db = await this.getDb();
    console.log(db.collections.chatMessages);
    const messages = db.collections.chatMessages.filter(
      (message: ChatMessage) =>
        (message.senderId === friendId || message.receiverId === friendId),
    );
    console.log(messages);
    return {
      items: messages,
      page: 1,
      pageSize: messages.length,
      total: messages.length,
      totalPages: 1,
    };
  }

  async sendChatMessage(receiverId: string, textMessage: string): Promise<ChatMessage> {
    const db = await this.getDb();
    const now = new Date();
    const message: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId: this.currentUserId,
      receiverId,
      textMessage,
      messageDateTimeUTC: now.toISOString(),
    };

    db.collections.chatMessages.push({
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      textMessage: message.textMessage,
      messageDateTimeUTC: message.messageDateTimeUTC,
      sent: true,
      delivered: true,
      read: message.read,
    });

    await saveDatabase(db);
    return message;
  }

  async markChatMessageAsRead(messageId: string): Promise<void> {
    const db = await this.getDb();
    db.collections.chatMessages
      .filter((message: ChatMessage) => message.id === messageId)
      .forEach((message) => {
        message.read = true;
      });
    await saveDatabase(db);
  }
}
