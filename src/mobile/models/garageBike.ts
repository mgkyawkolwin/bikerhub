import type { BikeType } from '../constants/bikeType';

export class GarageBike {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  cc?: string;
  type?: BikeType;
  images?: string[];
  mileage?: string;
  km?: string;
  vin?: string;
}
