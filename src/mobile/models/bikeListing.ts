import type { BikeType } from '../mobile/constants/bikeType';

export class BikeListing {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  cc?: number;
  type?: BikeType;
  sellerId?: string;
  sellerName?: string;
  location?: string;
  rating?: number;
  ratingCount: number = 0;
  phone?: string;
  imageUrl?: string;
  images?: string[];
  mileage?: string;
  km?: string;
  vin?: string;
  description?: string;
  favoritesCount: number = 0;
  isFavorite?: boolean;
  isLiked?: boolean;
  likeCount: number = 0;
  viewCount: number = 0;
}
