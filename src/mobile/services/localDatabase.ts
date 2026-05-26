import initialData from './mockdata';
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

let database: JsonDatabase | null = null;

export function getDatabase() {
  if (!database) {
    database = JSON.parse(JSON.stringify(initialData)) as JsonDatabase;
  }

  return Promise.resolve(database);
}

export async function saveDatabase(db: JsonDatabase) {
  database = db;
}
