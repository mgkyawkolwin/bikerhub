import Message from '@/models/message';
import type { PaginatedResult } from '@/models/paginatedResult';
import type { MessageService } from './messageService';
import { getDatabase, saveDatabase } from './localDatabase';

export class MockMessageService implements MessageService {
  private dbPromise = getDatabase();

  private async getDb() {
    return this.dbPromise;
  }

  async getMessages(page: number, pageSize: number): Promise<PaginatedResult<Message>> {
    const db = await this.getDb();
    const items = [...db.collections.messages].reverse();
    const size = typeof pageSize === 'number' ? pageSize : 1;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / size));
    const offset = (page - 1) * size;
    const rows = items.slice(offset, offset + size);
    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body ?? '',
        dateTimeUTC: row.dateTimeUTC ?? '',
        read: row.read ?? false,
      })),
      page,
      pageSize: size,
      total,
      totalPages,
    };
  }

  async getMessageById(messageId: string): Promise<Message> {
    const db = await this.getDb();
    const row = db.collections.messages.find((message) => message.id === messageId);
    if (!row) {
      return new Message();
    }
    return {
      id: row.id,
      title: row.title,
      body: row.body ?? '',
      dateTimeUTC: row.dateTimeUTC ?? '',
      read: row.read ?? false,
    } as Message;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const db = await this.getDb();
    db.collections.messages
      .filter((message) => message.id === messageId)
      .forEach((message) => {
        message.read = true;
      });
    await saveDatabase(db);
  }
}
