export type PlanRider = {
  userId?: string;
  displayName?: string;
  profilePictureUrl?: string;
  confirmed?: boolean;
};

export default class Plan {
  id?: string;
  title?: string;
  description?: string;
  distance?: number;
  duration?: number;
  elevation?: number;
  tripDateTimeUtc?: string;
  locationsJson?: string;
  staticMapUrl?: string;
  shareUrl?: string;
  riderIds?: string[];
  riders?: PlanRider[];
  confirmedCount?: number;
  maybeCount?: number;
  createdAtUTC?: string;
  createdById?: string;
  displayName?: string;
  profilePictureUrl?: string;
  updatedAtUTC?: string;
  updatedById?: string;
}
