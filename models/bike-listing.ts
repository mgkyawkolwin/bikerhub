import type { BikeType } from './bike-type';

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
  phone?: string;
  imageUrl?: string;
  images?: string[];
  mileage?: string;
  km?: string;
  vin?: string;
  description?: string;
}
