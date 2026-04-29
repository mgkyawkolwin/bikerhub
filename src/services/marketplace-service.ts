import type { BikeListing } from '@/models/bike-listing';
import type { MarketplaceFilter } from '@/models/marketplace-filter';
import type { PaginatedResult } from '@/models/paginated-result';

export const MarketplaceServiceToken = Symbol('MarketplaceService');

export interface MarketplaceService {
  getListings(filter: MarketplaceFilter, page: number, pageSize: number): Promise<PaginatedResult<BikeListing>>;
  getListingById(id: string): Promise<BikeListing | undefined>;
  createListing(listing: BikeListing): Promise<BikeListing>;
}
