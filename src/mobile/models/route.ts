export interface RouteLocation {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

export interface OSRMIntersection {
  out?: number;
  in?: number;
  entry: boolean[];
  bearings: number[];
  location: [number, number];
}

export interface OSRMManeuver {
  bearing_after: number;
  bearing_before: number;
  location: [number, number];
  modifier: string;
  type: string;
  instruction?: string;
  exit?: number;
}

export interface OSRMGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface OSRMStep {
  intersections: OSRMIntersection[];
  driving_side: string;
  geometry: OSRMGeometry;
  maneuver: OSRMManeuver;
  name: string;
  mode: string;
  weight: number;
  duration: number;
  distance: number;
  ref?: string;
}

export interface OSRMLeg {
  steps: OSRMStep[];
  weight: number;
  summary: string;
  duration: number;
  distance: number;
}

export interface OSRMWaypoint {
  hint: string;
  location: [number, number];
  name: string;
  distance: number;
}

export interface OSRMRoute {
  legs: OSRMLeg[];
  weight: number;
  summary: string;
  duration: number;
  distance: number;
  geometry: OSRMGeometry;
  weight_name: string;
}

export interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: OSRMWaypoint[];
}

export default class Route {
  id?: string;
  name?: string;
  description?: string;
  distance?: number;
  duration?: number;
  createdById?: string;
  osrmResponseJson?: string;
}
