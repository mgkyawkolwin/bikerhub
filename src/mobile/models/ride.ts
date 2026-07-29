export interface RideLocation {
  latitude: number;
  longitude: number;
  timestamp?: number;
  elevation?: number;
  speed?: number;
}

export default class Ride {
  id?: string;
  name?: string;
  description?: string;
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  totalElevation?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minElevation?: number;
  maxElevation?: number;
  elevation?: number;
  createdById?: string;
  locations?: RideLocation[];
}
