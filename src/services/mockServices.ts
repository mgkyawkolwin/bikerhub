import type { BikeListing } from '../models/bikeListing';
import type { MarketplaceFilter } from '../models/marketplaceFilter';
import type { PaginatedResult } from '../models/paginatedResult';
import type { StolenBikeReport } from '../models/stolenBikeReport';
import type { MarketplaceService } from './marketplaceService';
import type { StolenBikeService } from './stolenBikeService';
import type { FavoriteService } from './favoriteService';
import type { LikeService } from './likeService';
import type { RatingService } from './ratingService';
import type { ChatService, ChatThread, ChatMessage } from './chatService';
import type { MessageService, MessageItem, MessageDetail } from './messageService';
import { saveImageToLocalUri } from './imageStorage';
import { executeSql, getDatabase, selectAll, selectScalar } from './localDatabase';

const DEMO_LISTINGS: BikeListing[] = [
  {
    id: '1',
    title: 'Yamaha MT-15',
    make: 'Yamaha',
    model: 'MT-15',
    year: 2022,
    price: 4500000,
    cc: 155,
    type: 'Sport',
    sellerName: 'Aung Moe',
    location: 'Yangon',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    mileage: '8,400 Km',
    description: 'A sharp sport bike with excellent handling and style.',
  },
  {
    id: '2',
    title: 'Honda CB500X',
    make: 'Honda',
    model: 'CB500X',
    year: 2021,
    price: 9500000,
    cc: 471,
    type: 'Adventure',
    sellerName: 'Khin Hla',
    location: 'Mandalay',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    mileage: '12,200 Km',
    description: 'Comfortable touring-ready adventure bike with dependable Honda quality.',
  },
  {
    id: '3',
    title: 'Royal Enfield Classic 350',
    make: 'Royal Enfield',
    model: 'Classic 350',
    year: 2023,
    price: 6400000,
    cc: 349,
    type: 'Cruiser',
    sellerName: 'Thiri',
    location: 'Naypyitaw',
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    mileage: '4,500 Km',
    description: 'Iconic cruiser with timeless styling and smooth ride quality.',
  },
  {
    id: '4',
    title: 'Kawasaki Z650',
    make: 'Kawasaki',
    model: 'Z650',
    year: 2020,
    price: 7800000,
    cc: 649,
    type: 'Standard',
    sellerName: 'Min Thu',
    location: 'Bago',
    imageUrl:
      'https://images.unsplash.com/photo-1519937947077-74f88bc7ee82?auto=format&fit=crop&w=800&q=80',
    mileage: '9,100 Km',
    description: 'Nimble street bike with strong torque and confident mid-range power.',
  },
  {
    id: '5',
    title: 'BMW R NineT',
    make: 'BMW',
    model: 'R NineT',
    year: 2022,
    price: 24000000,
    cc: 1170,
    type: 'Custom',
    sellerName: 'Saw Htun',
    location: 'Taunggyi',
    imageUrl:
      'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
    mileage: '2,000 Km',
    description: 'Premium naked roadster with classic design and modern performance.',
  },
  {
    id: '6',
    title: 'Suzuki V-Strom 650',
    make: 'Suzuki',
    model: 'V-Strom 650',
    year: 2021,
    price: 8800000,
    cc: 645,
    type: 'Touring',
    sellerName: 'Nandar',
    location: 'Mawlamyine',
    imageUrl:
      'https://images.unsplash.com/photo-1470038716708-5f4485b722ea?auto=format&fit=crop&w=800&q=80',
    mileage: '18,300 Km',
    description: 'Adventure-ready touring bike built for long distance comfort.',
  },
  {
    id: '7',
    title: 'Ducati Monster 797',
    make: 'Ducati',
    model: 'Monster 797',
    year: 2019,
    price: 13200000,
    cc: 803,
    type: 'Sport',
    sellerName: 'Ei Mon',
    location: 'Pathein',
    imageUrl:
      'https://images.unsplash.com/photo-1524705691455-2dbd6d6d9f6d?auto=format&fit=crop&w=800&q=80',
    mileage: '7,900 Km',
    description: 'Italian muscle with aggressive styling and responsive riding feel.',
  },
  {
    id: '8',
    title: 'Honda CB300R',
    make: 'Honda',
    model: 'CB300R',
    year: 2023,
    price: 5600000,
    cc: 286,
    type: 'Standard',
    sellerName: 'Zaw Myint',
    location: 'Pyay',
    imageUrl:
      'https://images.unsplash.com/photo-1523430410477-8639ebcb9b7f?auto=format&fit=crop&w=800&q=80',
    mileage: '3,100 Km',
    description: 'Light and responsive modern classic for city riders.',
  },
  {
    id: '9',
    title: 'KTM 390 Duke',
    make: 'KTM',
    model: '390 Duke',
    year: 2022,
    price: 6100000,
    cc: 373,
    type: 'Sport',
    sellerName: 'Hla Hla',
    location: 'Sagaing',
    imageUrl:
      'https://images.unsplash.com/photo-1597772854698-c0007c1b7d5e?auto=format&fit=crop&w=800&q=80',
    mileage: '5,700 Km',
    description: 'Lightweight sport machine built for fast street riding.',
  },
  {
    id: '10',
    title: 'Triumph Tiger 900',
    make: 'Triumph',
    model: 'Tiger 900',
    year: 2021,
    price: 17000000,
    cc: 888,
    type: 'Adventure',
    sellerName: 'Cho Cho',
    location: 'Hpa-An',
    imageUrl:
      'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80',
    mileage: '13,600 Km',
    description: 'Capable adventure bike with great road manners and touring comfort.',
  },
];

const REPORTS: StolenBikeReport[] = [];

const CHAT_THREADS: ChatThread[] = [
  { id: 'seller-1', name: 'Aung Moe', lastMessage: 'Hi, are you still available for a test ride?', time: '2h', unread: 3 },
  { id: 'seller-2', name: 'Khin Hla', lastMessage: 'I can send more photos tonight.', time: '5h', unread: 0 },
  { id: 'seller-3', name: 'Thiri', lastMessage: 'Thanks for your interest, I will reserve it.', time: '1d', unread: 1 },
  { id: 'seller-4', name: 'Min Thu', lastMessage: 'Let me know if you want to meet this weekend.', time: '3d', unread: 0 },
  { id: 'seller-5', name: 'Saw Htun', lastMessage: 'I just updated the price, please check.', time: '1w', unread: 0 },
  { id: 'seller-6', name: 'Nandar', lastMessage: 'Yes, I can deliver it this weekend.', time: '3w', unread: 2 },
  { id: 'seller-7', name: 'Ei Mon', lastMessage: 'The bike comes with full documentation.', time: '4d', unread: 0 },
  { id: 'seller-8', name: 'Zaw Myint', lastMessage: 'I will send additional photos shortly.', time: '6h', unread: 1 },
];

const CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  'seller-1': [
    { id: 'm1-1', sender: 'other', text: 'Hi! I saw your listing and want to ask about the condition.', timestamp: 'Apr 28, 10:14 AM' },
    { id: 'm1-2', sender: 'me', text: 'Hi! It is in great shape and just serviced last month.', timestamp: 'Apr 28, 10:16 AM', status: 'seen' },
    { id: 'm1-3', sender: 'other', text: 'Nice, can I come by for a quick look tomorrow?', timestamp: 'Apr 28, 10:18 AM' },
  ],
  'seller-2': [
    { id: 'm2-1', sender: 'other', text: 'Can you share the maintenance history?', timestamp: 'Apr 25, 9:05 AM' },
    { id: 'm2-2', sender: 'me', text: 'Yes, I have records from the previous two years.', timestamp: 'Apr 25, 9:10 AM', status: 'sent' },
  ],
  'seller-3': [
    { id: 'm3-1', sender: 'other', text: 'Is the seat original?', timestamp: 'Apr 26, 4:22 PM' },
    { id: 'm3-2', sender: 'me', text: 'Yes, the seat is original and in good condition.', timestamp: 'Apr 26, 4:26 PM', status: 'seen' },
  ],
};

const MESSAGE_ITEMS: MessageItem[] = [
  { id: 'message-1', title: 'Payment issue', preview: 'We could not process your last payment. Please update your details.', time: 'Apr 28, 10:30 AM', unread: 1 },
  { id: 'message-2', title: 'New bike offer', preview: 'A seller near you listed a new Yamaha MT-15.', time: 'Apr 27, 4:15 PM', unread: 0 },
  { id: 'message-3', title: 'Price update', preview: 'The price was lowered on your saved item.', time: 'Apr 26, 2:05 PM', unread: 2 },
  { id: 'message-4', title: 'Service reminder', preview: 'Your bike service appointment is scheduled for tomorrow.', time: 'Apr 25, 9:00 AM', unread: 0 },
  { id: 'message-5', title: 'Buyer inquiry', preview: 'Is the bike still available?', time: 'Apr 24, 8:20 AM', unread: 1 },
  { id: 'message-6', title: 'Offer accepted', preview: 'Your offer has been accepted. Please check the details.', time: 'Apr 23, 11:45 AM', unread: 0 },
];

const MESSAGE_DETAILS: Record<string, MessageDetail> = {
  'message-1': {
    id: 'message-1',
    title: 'Payment issue',
    body: 'We could not process your last payment due to an expired card. Please update your payment details in account settings to continue using our services without interruption.',
    time: 'Apr 28, 10:30 AM',
    sender: 'System',
    status: 'seen',
  },
  'message-2': {
    id: 'message-2',
    title: 'New bike offer',
    body: 'A seller near you has listed a new Yamaha MT-15 at a great price. Tap to view the listing and contact the seller.',
    time: 'Apr 27, 4:15 PM',
    sender: 'Marketplace Alerts',
    status: 'sent',
  },
  'message-3': {
    id: 'message-3',
    title: 'Price update',
    body: 'The price was lowered on your saved item. Check the updated offer and make a decision before the listing expires.',
    time: 'Apr 26, 2:05 PM',
    sender: 'Pricing Team',
    status: 'seen',
  },
  'message-4': {
    id: 'message-4',
    title: 'Service reminder',
    body: 'Your bike service appointment is scheduled for tomorrow at 10:00 AM. Please bring the necessary documents.',
    time: 'Apr 25, 9:00 AM',
    sender: 'Service Desk',
    status: 'sent',
  },
  'message-5': {
    id: 'message-5',
    title: 'Buyer inquiry',
    body: 'A buyer asked: "Is the bike still available?" Please reply as soon as possible to keep the lead warm.',
    time: 'Apr 24, 8:20 AM',
    sender: 'Buyer Support',
    status: 'seen',
  },
  'message-6': {
    id: 'message-6',
    title: 'Offer accepted',
    body: 'Your offer has been accepted. Please check the details and arrange delivery with the seller.',
    time: 'Apr 23, 11:45 AM',
    sender: 'Sales Team',
    status: 'sent',
  },
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function applyFilter(item: BikeListing, filter: MarketplaceFilter) {
  const make = filter.make?.trim().toLowerCase();
  const model = filter.model?.trim().toLowerCase();
  const year = filter.modelYear?.trim();
  const min = filter.priceMin ?? 0;
  const max = filter.priceMax ?? Number.MAX_SAFE_INTEGER;
  const cc = filter.cc?.trim();
  const type = filter.type;

  if (make && !item.make?.toLowerCase().includes(make) && !item.title?.toLowerCase().includes(make)) {
    return false;
  }

  if (model && !item.model?.toLowerCase().includes(model) && !item.title?.toLowerCase().includes(model)) {
    return false;
  }

  if (year && String(item.year) !== year) {
    return false;
  }

  if (filter.priceMin != null && (item.price ?? 0) < min) {
    return false;
  }

  if (filter.priceMax != null && (item.price ?? 0) > max) {
    return false;
  }

  if (cc && !String(item.cc ?? '').startsWith(cc)) {
    return false;
  }

  if (type && item.type !== type) {
    return false;
  }

  if (filter.location && !item.location?.toLowerCase().includes(filter.location.trim().toLowerCase())) {
    return false;
  }

  return true;
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export class MockServices implements MarketplaceService, StolenBikeService, FavoriteService, LikeService, RatingService, ChatService, MessageService {
  private dbPromise = getDatabase({
    listings: DEMO_LISTINGS,
    reports: REPORTS,
    chatThreads: CHAT_THREADS,
    chatMessages: CHAT_MESSAGES,
    messageItems: MESSAGE_ITEMS,
    messageDetails: MESSAGE_DETAILS,
  });

  private async getDb() {
    return this.dbPromise;
  }

  private parseListingRow(row: any): BikeListing {
    return {
      id: row.id,
      title: row.title,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      cc: row.cc,
      type: row.type,
      sellerName: row.sellerName,
      location: row.location,
      imageUrl: row.imageUrl,
      mileage: row.mileage,
      description: row.description,
      images: row.images ? JSON.parse(row.images) : undefined,
    };
  }

  private parseReportRow(row: any): StolenBikeReport {
    return {
      id: row.id,
      title: row.title,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      cc: row.cc,
      km: row.km,
      vin: row.vin,
      type: row.type,
      description: row.description,
      images: row.images ? JSON.parse(row.images) : undefined,
      reportedAt: row.reportedAt,
      location: row.location,
    };
  }

  private async getFavoriteCount(listingId: string) {
    const row = await selectScalar<{ count: number }>(await this.getDb(), 'SELECT COUNT(1) AS count FROM favorites WHERE listingId = ?;', [listingId]);
    return row?.count ?? 0;
  }

  private async getLikeCount(listingId: string) {
    const row = await selectScalar<{ count: number }>(await this.getDb(), 'SELECT COUNT(1) AS count FROM likes WHERE listingId = ?;', [listingId]);
    return row?.count ?? 0;
  }

  private async applyCounts(item: BikeListing) {
    if (!item.id) {
      return {
        ...item,
        favoritesCount: 0,
        likeCount: 0,
        rating: 0,
        ratingCount: 0,
      };
    }

    const [favoriteCount, likeCount, rating] = await Promise.all([
      this.getFavoriteCount(item.id),
      this.getLikeCount(item.id),
      this.getRating(item.id),
    ]);

    return {
      ...item,
      favoritesCount: favoriteCount,
      likeCount,
      rating: rating.value,
      ratingCount: rating.count,
    };
  }

  private async saveImages(images?: string[], imageUrl?: string) {
    const candidateUris = images?.length ? images : imageUrl ? [imageUrl] : [];
    if (!candidateUris?.length) {
      return { images: undefined, imageUrl };
    }

    const savedImages = await Promise.all(
      candidateUris.map(async (uri) => {
        try {
          return await saveImageToLocalUri(uri);
        } catch {
          return uri;
        }
      }),
    );

    return {
      images: savedImages,
      imageUrl: savedImages[0] ?? undefined,
    };
  }

  async getListings(filter: MarketplaceFilter, page: number, pageSize: number) {
    const db = await this.getDb();
    const rows = await selectAll<any>(db, 'SELECT * FROM listings;');
    const items = rows.map((row) => this.parseListingRow(row));
    const filtered = items.filter((item) => applyFilter(item, filter));
    const result = paginate(filtered, page, pageSize);
    return {
      ...result,
      items: await Promise.all(result.items.map((item) => this.applyCounts(item))),
    };
  }

  async getListingById(id: string) {
    const db = await this.getDb();
    const row = await selectScalar<any>(db, 'SELECT * FROM listings WHERE id = ?;', [id]);
    if (!row) {
      return undefined;
    }

    return this.applyCounts(this.parseListingRow(row));
  }

  async createListing(listing: BikeListing) {
    const saved = await this.saveImages(listing.images, listing.imageUrl);
    const newListing: BikeListing = {
      ...listing,
      ...saved,
      id: String(Date.now()),
      sellerName: listing.sellerName ?? 'You',
      location: listing.location ?? 'Yangon',
    };

    const db = await this.getDb();
    await executeSql(db,
      `INSERT OR REPLACE INTO listings (id, title, make, model, year, price, cc, type, sellerName, location, imageUrl, mileage, description, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newListing.id,
        newListing.title ?? null,
        newListing.make ?? null,
        newListing.model ?? null,
        newListing.year ?? null,
        newListing.price ?? null,
        newListing.cc ?? null,
        newListing.type ?? null,
        newListing.sellerName ?? null,
        newListing.location ?? null,
        newListing.imageUrl ?? null,
        newListing.mileage ?? null,
        newListing.description ?? null,
        newListing.images ? JSON.stringify(newListing.images) : null,
      ],
    );

    return newListing;
  }

  async createReport(report: StolenBikeReport) {
    const saved = await this.saveImages(report.images);
    const newReport: StolenBikeReport = {
      ...report,
      ...saved,
      id: generateId(),
      reportedAt: new Date().toISOString(),
    };

    const db = await this.getDb();
    await executeSql(db,
      `INSERT OR REPLACE INTO reports (id, title, make, model, year, price, cc, km, vin, type, description, images, reportedAt, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newReport.id,
        newReport.title ?? null,
        newReport.make ?? null,
        newReport.model ?? null,
        newReport.year ?? null,
        newReport.price ?? null,
        newReport.cc ?? null,
        newReport.km ?? null,
        newReport.vin ?? null,
        newReport.type ?? null,
        newReport.description ?? null,
        newReport.images ? JSON.stringify(newReport.images) : null,
        newReport.reportedAt ?? null,
        newReport.location ?? null,
      ],
    );

    return newReport;
  }

  async getFavorites() {
    const db = await this.getDb();
    const rows = await selectAll<any>(db,
      `SELECT l.* FROM listings l
       JOIN favorites f ON l.id = f.listingId;`,
    );
    const favorites = rows.map((row) => this.parseListingRow(row));
    return Promise.all(favorites.map((item) => this.applyCounts(item)));
  }

  async toggleFavorite(listingId: string) {
    if (!listingId) {
      return;
    }

    const db = await this.getDb();
    const row = await selectScalar<any>(db, 'SELECT listingId FROM favorites WHERE listingId = ?;', [listingId]);
    if (row) {
      await executeSql(db, 'DELETE FROM favorites WHERE listingId = ?;', [listingId]);
    } else {
      await executeSql(db, 'INSERT INTO favorites (listingId) VALUES (?);', [listingId]);
    }
  }

  async isFavorite(listingId: string) {
    if (!listingId) {
      return false;
    }

    const row = await selectScalar<{ count: number }>(await this.getDb(), 'SELECT COUNT(1) AS count FROM favorites WHERE listingId = ?;', [listingId]);
    return Boolean(row?.count);
  }

  async getLikedIds() {
    const db = await this.getDb();
    const rows = await selectAll<{ listingId: string }>(db, 'SELECT listingId FROM likes;');
    return rows.map((row) => row.listingId);
  }

  async toggleLike(listingId: string) {
    if (!listingId) {
      return;
    }

    const db = await this.getDb();
    const row = await selectScalar<any>(db, 'SELECT listingId FROM likes WHERE listingId = ?;', [listingId]);
    if (row) {
      await executeSql(db, 'DELETE FROM likes WHERE listingId = ?;', [listingId]);
    } else {
      await executeSql(db, 'INSERT INTO likes (listingId) VALUES (?);', [listingId]);
    }
  }

  async isLiked(listingId: string) {
    if (!listingId) {
      return false;
    }

    const row = await selectScalar<{ count: number }>(await this.getDb(), 'SELECT COUNT(1) AS count FROM likes WHERE listingId = ?;', [listingId]);
    return Boolean(row?.count);
  }

  async getRating(listingId: string) {
    if (!listingId) {
      return { value: 0, count: 0 };
    }

    const row = await selectScalar<{ ratingCount: number; ratingTotal: number }>(await this.getDb(),
      'SELECT ratingCount, ratingTotal FROM ratingTotals WHERE listingId = ?;',
      [listingId],
    );

    const count = row?.ratingCount ?? 0;
    const total = row?.ratingTotal ?? 0;
    return {
      value: count > 0 ? total / count : 0,
      count,
    };
  }

  async submitRating(listingId: string, rating: number) {
    if (!listingId || rating <= 0) {
      return { value: 0, count: 0 };
    }

    const db = await this.getDb();
    const row = await selectScalar<{ ratingCount: number; ratingTotal: number }>(db,
      'SELECT ratingCount, ratingTotal FROM ratingTotals WHERE listingId = ?;',
      [listingId],
    );

    const currentCount = row?.ratingCount ?? 0;
    const currentTotal = row?.ratingTotal ?? 0;
    const nextCount = currentCount + 1;
    const nextTotal = currentTotal + rating;

    if (row) {
      await executeSql(db,
        'UPDATE ratingTotals SET ratingCount = ?, ratingTotal = ? WHERE listingId = ?;',
        [nextCount, nextTotal, listingId],
      );
    } else {
      await executeSql(db,
        'INSERT INTO ratingTotals (listingId, ratingCount, ratingTotal) VALUES (?, ?, ?);',
        [listingId, nextCount, nextTotal],
      );
    }

    return {
      value: nextTotal / nextCount,
      count: nextCount,
    };
  }

  async getReports() {
    const db = await this.getDb();
    const rows = await selectAll<any>(db, 'SELECT * FROM reports;');
    return rows.map((row) => this.parseReportRow(row));
  }

  async getReportById(id: string) {
    const db = await this.getDb();
    const row = await selectScalar<any>(db, 'SELECT * FROM reports WHERE id = ?;', [id]);
    return row ? this.parseReportRow(row) : undefined;
  }

  getMessages(page: number, pageSize: number): Promise<import('./messageService').MessagePage>;
  getMessages(threadId: string): Promise<ChatMessage[]>;
  async getMessages(arg1: number | string, pageSize?: number): Promise<any> {
    if (typeof arg1 === 'number') {
      const db = await this.getDb();
      const totalRow = await selectScalar<{ count: number }>(db, 'SELECT COUNT(1) AS count FROM messages;');
      const total = totalRow?.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / (pageSize ?? 1)));
      const offset = (arg1 - 1) * (pageSize ?? 1);
      const rows = await selectAll<any>(db,
        'SELECT id, title, preview, time, unread FROM messages ORDER BY rowid DESC LIMIT ? OFFSET ?;', [pageSize ?? 1, offset],
      );
      return {
        items: rows.map((row) => ({
          id: row.id,
          title: row.title,
          preview: row.preview,
          time: row.time,
          unread: row.unread ?? 0,
        })),
        page: arg1,
        pageSize: pageSize ?? 1,
        total,
        totalPages,
      };
    }

    const db = await this.getDb();
    const rows = await selectAll<any>(db,
      'SELECT id, sender, text, timestamp, status FROM chatMessages WHERE threadId = ? ORDER BY rowid ASC;',
      [arg1],
    );
    return rows.map((row) => ({
      id: row.id,
      sender: row.sender,
      text: row.text,
      timestamp: row.timestamp,
      status: row.status as 'sent' | 'seen' | undefined,
    }));
  }

  async getMessageById(messageId: string) {
    const db = await this.getDb();
    const row = await selectScalar<any>(db, 'SELECT * FROM messages WHERE id = ?;', [messageId]);
    return row
      ? {
          id: row.id,
          title: row.title,
          body: row.body,
          time: row.time,
          sender: row.sender,
          status: row.status as 'sent' | 'seen',
        }
      : undefined;
  }

  async markAsRead(messageId: string) {
    const db = await this.getDb();
    await executeSql(db, 'UPDATE messages SET unread = 0 WHERE id = ?;', [messageId]);
  }

  async getThreads(page: number, pageSize: number) {
    const db = await this.getDb();
    const totalRow = await selectScalar<{ count: number }>(db, 'SELECT COUNT(1) AS count FROM chatThreads;');
    const total = totalRow?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const rows = await selectAll<any>(db,
      'SELECT * FROM chatThreads ORDER BY rowid DESC LIMIT ? OFFSET ?;',
      [pageSize, offset],
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        lastMessage: row.lastMessage,
        time: row.time,
        unread: row.unread ?? 0,
      })),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  async sendMessage(threadId: string, text: string) {
    const now = new Date();
    const message: ChatMessage = {
      id: `${threadId}-${Date.now()}`,
      sender: 'me',
      text,
      timestamp: `${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'sent',
    };

    const db = await this.getDb();
    await executeSql(db,
      `INSERT OR REPLACE INTO chatMessages (id, threadId, sender, text, timestamp, status)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [message.id, threadId, message.sender, message.text, message.timestamp, message.status],
    );

    await executeSql(db,
      `UPDATE chatThreads SET lastMessage = ?, time = ?, unread = 0 WHERE id = ?;`,
      [text, 'Now', threadId],
    );

    return message;
  }
}
