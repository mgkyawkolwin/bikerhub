import type { BikeType } from './bikeType';

export class BikeListing {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  cc?: number;
  type?: BikeType;
  sellerName?: string;
  location?: string;
  likeCount?: number;
  rating?: number;
  ratingCount?: number;
  phone?: string;
  imageUrl?: string;
  images?: string[];
  mileage?: string;
  km?: string;
  vin?: string;
  description?: string;
  favoritesCount?: number;
}
