import type { LatLng } from 'react-native-maps';
import type { OSRMResponse, RouteLocation } from '@/models/route';

export interface RouteDraft {
  locations: LatLng[];
  routePath?: RouteLocation[];
  totalDistance: number;
  totalDuration: number;
  osrmResponse?: OSRMResponse;
  waypoints?: any[];
  segments?: any[];
}

let currentRouteDraft: RouteDraft | null = null;

export const setRouteDraft = (draft: RouteDraft | null) => {
  currentRouteDraft = draft;
};

export const getRouteDraft = (): RouteDraft | null => currentRouteDraft;

export const clearRouteDraft = () => {
  currentRouteDraft = null;
};
