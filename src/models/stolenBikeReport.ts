import type { BikeType } from '../constants/bikeType';

export type StolenBikeReport = {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  cc?: number;
  km?: string;
  vin?: string;
  type?: BikeType;
  description?: string;
  images?: string[];
  reportedAt?: string;
  location?: string;
};
