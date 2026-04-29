import type { BikeListing } from '@/models/bikeListing';

export const FavoriteServiceToken = Symbol('FavoriteService');

export interface FavoriteService {
  getFavorites(): Promise<BikeListing[]>;
  toggleFavorite(listingId: string): Promise<void>;
  isFavorite(listingId: string): Promise<boolean>;
}
