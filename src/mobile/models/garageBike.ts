import type { BikeType } from '../constants/bikeType';
import { Media } from './media';

export class GarageBike {
  id?: string;
  make?: string;
  model?: string;
  edition?: string;
  year?: number;
  cc?: string;
  type?: BikeType;
  images?: Media[];
  km?: string;
  vin?: string;
  createdById?: string;
}

export class GarageBikeServiceHistory {
  id?: string;
  garageBikeId?: string;
  serviceType?: string;
  name?: string;
  serviceDate?: string;
  mileage?: number;
}
