import { File, Paths } from 'expo-file-system';
import initialData from './mockdata.json';
import type { BikeListing } from '../models/bikeListing';
import type { StolenBikeReport } from '../models/stolenBikeReport';
import type ChatMessage from '../models/chatMesage';
import ChatHead from '@/models/chatHead';
import User from '@/models/user';
import Message from '@/models/message';
import type News from '../models/news';
import type Blog from '../models/blog';
import type ForumPost from '../models/forumPost';
import type SocialPost from '../models/socialPost';
import type Directory from '../models/directory';
import type Route from '../models/route';
import type Group from '../models/group';
import type Challenge from '../models/challenge';
import type SocialProfile from '../models/socialProfile';

const DATABASE_FILE_NAME = 'mockdatax.json';
const DATABASE_FILE = new File(Paths.document, DATABASE_FILE_NAME);

export type DatabaseCollections = {
  users: User[];
  listings: BikeListing[];
  reports: StolenBikeReport[];
  chatHeads: ChatHead[];
  chatMessages: ChatMessage[];
  messages: Message[];
  news: News[];
  blogs: Blog[];
  forums: ForumPost[];
  directories: Directory[];
  routes: Route[];
  plans: any[];
  socialPosts: SocialPost[];
  socialProfiles: SocialProfile[];
  groups: Group[];
  challenges: Challenge[];
  config?: {
    businessTypes: string[];
    cities: string[];
    stateDivisions: string[];
  };
  likes: { id: string; listingId: string; userId: string }[];
  ratingTotals: { id: string; listingId: string; ratingCount: number; ratingTotal: number }[];
};

export type JsonDatabase = {
  collections: DatabaseCollections;
};

let databasePromise: Promise<JsonDatabase> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = initializeDatabase();
  }

  return databasePromise;
}

export async function saveDatabase(db: JsonDatabase) {
  const fileInfo = await DATABASE_FILE.info();
  if (!fileInfo.exists) {
    await DATABASE_FILE.create();
  }

  await DATABASE_FILE.write(JSON.stringify(db));
}

async function initializeDatabase(): Promise<JsonDatabase> {
  const fileInfo = await DATABASE_FILE.info();

  if (fileInfo.exists) {
    try {
      const contents = await DATABASE_FILE.text();
      return JSON.parse(contents) as JsonDatabase;
    } catch {
      // If the file is malformed, recreate it.
    }
  }

  const db = JSON.parse(JSON.stringify(initialData)) as JsonDatabase;
  if (!fileInfo.exists) {
    await DATABASE_FILE.create({ overwrite: true });
  }

  await DATABASE_FILE.write(JSON.stringify(db));
  return db;
}
