export interface RideLocation {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

export default class Ride {
  id?: string;
  name?: string;
  description?: string;
  distance?: number;
  duration?: number;
  createdById?: string;
  locations?: RideLocation[];
}
