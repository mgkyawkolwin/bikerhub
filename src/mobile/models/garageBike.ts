import type { BikeType } from '../constants/bikeType';
import { Media } from './media';

export class GarageBike {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  cc?: string;
  type?: BikeType;
  images?: Media[];
  km?: string;
  vin?: string;
  createdById?: string;
}
