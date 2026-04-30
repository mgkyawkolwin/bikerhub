import type { BikeListing } from '@/models/bikeListing';
import type { MarketplaceFilter } from '@/models/marketplaceFilter';
import type { PaginatedResult } from '@/models/paginatedResult';

export const MarketplaceServiceToken = Symbol('MarketplaceService');

export interface MarketplaceService {
  getListings(filter: MarketplaceFilter, page: number, pageSize: number): Promise<PaginatedResult<BikeListing>>;
  getListingById(id: string): Promise<BikeListing | undefined>;
  createListing(listing: BikeListing): Promise<BikeListing>;
  toggleFavorite(listingId: string): Promise<void>;
  toggleLike(listingId: string): Promise<void>;
  submitRating(listingId: string, rating: number): Promise<BikeListing | undefined>;
}
