import type { BikeListing } from '../models/bikeListing';
import type { MarketplaceFilter } from '../models/marketplaceFilter';
import type { PaginatedResult } from '../models/paginatedResult';
import type { StolenBikeReport } from '../models/stolenBikeReport';
import type { MarketplaceService } from './marketplaceService';
import type { StolenBikeService } from './stolenBikeService';
import { saveImageToLocalUri } from './imageStorage';
import { getDatabase, saveDatabase } from './localDatabase';
import User from '@/models/user';

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

export class MockMarketPlaceService implements MarketplaceService, StolenBikeService {
  private dbPromise = getDatabase();
  private readonly currentUserId = '00000000-0000-0000-0000-000000000000';

  private async getDb() {
    return this.dbPromise;
  }

  private getUserById(db: any, userId?: string) {
    return db?.collections?.users?.find((user: any) => user.id === userId);
  }

  private parseListingRow(row: any, db: any): BikeListing {
    const seller = this.getUserById(db, row.sellerId);
    return {
      id: row.id,
      title: row.title,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      cc: row.cc,
      type: row.type,
      sellerId: row.sellerId,
      sellerName: seller?.name ?? row.sellerName,
      location: seller?.location ?? row.location,
      imageUrl: row.imageUrl,
      mileage: row.mileage,
      description: row.description,
      ratingCount: row.ratingCount ?? 0,
      favoritesCount: row.favoritesCount ?? 0,
      likeCount: row.likeCount ?? 0,
      viewCount: row.viewCount ?? 0,
      isFavorite: row.isFavorite ?? false,
      images: Array.isArray(row.images)
        ? row.images
        : typeof row.images === 'string'
          ? JSON.parse(row.images)
          : undefined,
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
      images: Array.isArray(row.images)
        ? row.images
        : typeof row.images === 'string'
          ? JSON.parse(row.images)
          : undefined,
      reportedAt: row.reportedAt,
      location: row.location,
    };
  }

  private async getLikeCount(listingId: string) {
    const db = await this.getDb();
    return db.collections.likes.filter((entry) => entry.listingId === listingId).length;
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

    const [likeCount, rating] = await Promise.all([
      this.getLikeCount(item.id),
      this.getRating(item.id),
    ]);

    return {
      ...item,
      favoritesCount: item.favoritesCount ?? 0,
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
    const rows = db.collections.listings;
    const items = rows.map((row) => this.parseListingRow(row, db));
    const filtered = items.filter((item) => applyFilter(item, filter));
    const result = paginate(filtered, page, pageSize);
    return {
      ...result,
      items: await Promise.all(result.items.map((item) => this.applyCounts(item))),
    };
  }

  async getListingById(id: string) {
    const db = await this.getDb();
    const row = db.collections.listings.find((listing) => listing.id === id);
    if (!row) {
      return undefined;
    }

    return this.applyCounts(this.parseListingRow(row, db));
  }

  async createListing(listing: BikeListing) {
    const saved = await this.saveImages(listing.images, listing.imageUrl);
    const newListing: BikeListing = {
      ...listing,
      ...saved,
      id: String(Date.now()),
      sellerId: listing.sellerId ?? 'c4b3ab22-32a4-4f31-bb1f-2bf44e95fea6',
    };

    const db = await this.getDb();
    db.collections.listings.push(newListing);
    await saveDatabase(db);
    return this.parseListingRow(newListing, db);
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
    db.collections.reports.push(newReport);
    await saveDatabase(db);
    return newReport;
  }

  async getFavorites() {
    const db = await this.getDb();
    const favoriteIds = new Set(db.collections.listings.filter((listing) => listing.isFavorite).map((listing) => listing.id));
    const favorites = db.collections.listings.filter((listing) => listing.id != null && favoriteIds.has(listing.id));
    return Promise.all(favorites.map((item) => this.applyCounts(this.parseListingRow(item, db))));
  }

  async toggleFavorite(listingId: string) {
    console.log('FUNCTION CALLED: toggleFavorite');
    console.log(listingId);
    if (!listingId) {
      return;
    }

    const db = await this.getDb();
    const listing = db.collections.listings.find((entry) => entry.id === listingId);
    console.log(listing);
    if(!listing)  throw new Error('Listing not found');
    listing.isFavorite = !listing.isFavorite;
    if(listing.isFavorite)
      listing.favoritesCount += 1;
    else
      listing.favoritesCount -= 1;
    console.log('Updated listing:', listing);

    await saveDatabase(db);
  }

  async getLikedIds() {
    const db = await this.getDb();
    return db.collections.likes.map((entry) => entry.listingId);
  }

  async toggleLike(listingId: string) {
    if (!listingId) {
      return;
    }

    const db = await this.getDb();
    const index = db.collections.likes.findIndex((entry) => entry.listingId === listingId);
    if (index >= 0) {
      db.collections.likes.splice(index, 1);
    } else {
      db.collections.likes.push({ id: generateId(), listingId, userId: 'c4b3ab22-32a4-4f31-bb1f-2bf44e95fea6' });
    }

    await saveDatabase(db);
  }

  async isLiked(listingId: string) {
    if (!listingId) {
      return false;
    }

    const db = await this.getDb();
    return db.collections.likes.some((entry) => entry.listingId === listingId);
  }

  async getRating(listingId: string) {
    if (!listingId) {
      return { value: 0, count: 0 };
    }

    const db = await this.getDb();
    const row = db.collections.ratingTotals.find((entry) => entry.listingId === listingId);
    const count = row?.ratingCount ?? 0;
    const total = row?.ratingTotal ?? 0;
    return {
      value: count > 0 ? total / count : 0,
      count,
    };
  }

  async submitRating(listingId: string, rating: number) : Promise<BikeListing | undefined> {
    if (!listingId) {
      throw new Error('Listing ID is required for submitting a rating.');
    }

    const db = await this.getDb();
    const existing = db.collections.listings.find((entry) => entry.id === listingId);
    const ratingRow = db.collections.ratingTotals.find((entry) => entry.listingId === listingId);

    if (ratingRow) {
      ratingRow.ratingCount += 1;
      ratingRow.ratingTotal += rating;
    } else {
      db.collections.ratingTotals.push({ id: generateId(), listingId, ratingCount: 1, ratingTotal: rating });
    }

    if (existing) {
      existing.ratingCount = (existing.ratingCount ?? 0) + 1;
      existing.rating = (existing.rating ?? 0) + rating;
    }

    await saveDatabase(db);
    return this.getListingById(listingId);
  }

  async getReports() {
    const db = await this.getDb();
    return db.collections.reports.map((row) => this.parseReportRow(row));
  }

  async getReportById(id: string) {
    const db = await this.getDb();
    const row = db.collections.reports.find((report) => report.id === id);
    return row ? this.parseReportRow(row) : undefined;
  }

}
