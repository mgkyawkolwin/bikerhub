import * as SQLite from 'expo-sqlite';
import type { BikeListing } from '../models/bikeListing';
import type { StolenBikeReport } from '../models/stolenBikeReport';
import type { ChatThread, ChatMessage } from './chatService';
import type { MessageItem, MessageDetail } from './messageService';

const DATABASE_NAME = 'bikerhub.db';
let databasePromise: Promise<SQLite.WebSQLDatabase> | null = null;

export type SeedData = {
  listings: BikeListing[];
  reports: StolenBikeReport[];
  chatThreads: ChatThread[];
  chatMessages: Record<string, ChatMessage[]>;
  messageItems: MessageItem[];
  messageDetails: Record<string, MessageDetail>;
};

export function getDatabase(seedData: SeedData) {
  if (!databasePromise) {
    databasePromise = initializeDatabase(seedData);
  }

  return databasePromise;
}

function openDatabase() {
  return SQLite.openDatabase(DATABASE_NAME);
}

export function executeSql(db: SQLite.WebSQLDatabase, sql: string, params: any[] = []) {
  return new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_tx, result) => resolve(result),
          (_tx, error) => {
            reject(error);
            return false;
          },
        );
      },
      reject,
    );
  });
}

function transactionAsync(db: SQLite.WebSQLDatabase, action: (tx: SQLite.SQLTransaction) => void) {
  return new Promise<void>((resolve, reject) => {
    db.transaction(action, reject, resolve);
  });
}

export async function selectAll<T>(db: SQLite.WebSQLDatabase, sql: string, params: any[] = []): Promise<T[]> {
  const result = await executeSql(db, sql, params);
  return (result.rows as any)._array as T[];
}

export async function selectScalar<T>(db: SQLite.WebSQLDatabase, sql: string, params: any[] = []) {
  const result = await executeSql(db, sql, params);
  return ((result.rows as any)._array[0] ?? null) as T | null;
}

async function initializeDatabase(seedData: SeedData) {
  const db = openDatabase();

  await transactionAsync(db, (tx) => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        title TEXT,
        make TEXT,
        model TEXT,
        year INTEGER,
        price INTEGER,
        cc INTEGER,
        type TEXT,
        sellerName TEXT,
        location TEXT,
        imageUrl TEXT,
        mileage TEXT,
        description TEXT,
        images TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS favorites (
        listingId TEXT PRIMARY KEY
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS likes (
        listingId TEXT PRIMARY KEY
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS ratingTotals (
        listingId TEXT PRIMARY KEY,
        ratingCount INTEGER,
        ratingTotal INTEGER
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT,
        make TEXT,
        model TEXT,
        year INTEGER,
        price INTEGER,
        cc INTEGER,
        km TEXT,
        vin TEXT,
        type TEXT,
        description TEXT,
        images TEXT,
        reportedAt TEXT,
        location TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS chatThreads (
        id TEXT PRIMARY KEY,
        name TEXT,
        lastMessage TEXT,
        time TEXT,
        unread INTEGER
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS chatMessages (
        id TEXT PRIMARY KEY,
        threadId TEXT,
        sender TEXT,
        text TEXT,
        timestamp TEXT,
        status TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        title TEXT,
        preview TEXT,
        body TEXT,
        time TEXT,
        sender TEXT,
        status TEXT,
        unread INTEGER
      );
    `);
  });

  const count = await selectScalar<{ count: number }>(db, 'SELECT COUNT(1) AS count FROM listings;');
  if (!count || count.count === 0) {
    await seedDatabase(db, seedData);
  }

  return db;
}

async function seedDatabase(db: SQLite.WebSQLDatabase, seedData: SeedData) {
  for (const listing of seedData.listings) {
    await executeSql(db,
      `INSERT OR REPLACE INTO listings (id, title, make, model, year, price, cc, type, sellerName, location, imageUrl, mileage, description, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        listing.id ?? generateId(),
        listing.title ?? null,
        listing.make ?? null,
        listing.model ?? null,
        listing.year ?? null,
        listing.price ?? null,
        listing.cc ?? null,
        listing.type ?? null,
        listing.sellerName ?? null,
        listing.location ?? null,
        listing.imageUrl ?? null,
        listing.mileage ?? null,
        listing.description ?? null,
        listing.images ? JSON.stringify(listing.images) : null,
      ],
    );
  }

  for (const report of seedData.reports) {
    await executeSql(db,
      `INSERT OR REPLACE INTO reports (id, title, make, model, year, price, cc, km, vin, type, description, images, reportedAt, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        report.id ?? generateId(),
        report.title ?? null,
        report.make ?? null,
        report.model ?? null,
        report.year ?? null,
        report.price ?? null,
        report.cc ?? null,
        report.km ?? null,
        report.vin ?? null,
        report.type ?? null,
        report.description ?? null,
        report.images ? JSON.stringify(report.images) : null,
        report.reportedAt ?? null,
        report.location ?? null,
      ],
    );
  }

  for (const thread of seedData.chatThreads) {
    await executeSql(db,
      `INSERT OR REPLACE INTO chatThreads (id, name, lastMessage, time, unread)
       VALUES (?, ?, ?, ?, ?);`,
      [thread.id, thread.name, thread.lastMessage, thread.time, thread.unread ?? 0],
    );
  }

  for (const threadId of Object.keys(seedData.chatMessages)) {
    for (const message of seedData.chatMessages[threadId]) {
      await executeSql(db,
        `INSERT OR REPLACE INTO chatMessages (id, threadId, sender, text, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [message.id, threadId, message.sender, message.text, message.timestamp, message.status ?? null],
      );
    }
  }

  const detailsById = seedData.messageDetails;
  for (const message of seedData.messageItems) {
    const detail = detailsById[message.id];
    await executeSql(db,
      `INSERT OR REPLACE INTO messages (id, title, preview, body, time, sender, status, unread)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        message.id,
        message.title,
        message.preview,
        detail?.body ?? null,
        message.time ?? detail?.time ?? null,
        detail?.sender ?? null,
        detail?.status ?? null,
        message.unread ?? 0,
      ],
    );
  }

  for (const entry of Object.values(seedData.messageDetails)) {
    if (seedData.messageItems.some((message) => message.id === entry.id)) {
      continue;
    }

    await executeSql(db,
      `INSERT OR REPLACE INTO messages (id, title, preview, body, time, sender, status, unread)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [entry.id, entry.title, null, entry.body, entry.time, entry.sender, entry.status ?? null, 0],
    );
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
