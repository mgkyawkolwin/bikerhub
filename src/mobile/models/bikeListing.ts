import type { BikeType } from '../constants/bikeType';
import { Media } from './media';

export class BikeListing {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  cc?: string;
  type?: BikeType;
  sellerId?: string;
  sellerName?: string;
  sellerCity?: string;
  sellerCountry?: string;
  rating?: number;
  ratingCount?: number = 0;
  sellerPhone?: string;
  mileage?: string;
  km?: string;
  vin?: string;
  description?: string;
  favoritesCount?: number = 0;
  isFavorite?: boolean;
  isLiked?: boolean;
  likeCount?: number = 0;
  viewCount?: number = 0;
  medias?: Media[];
}
