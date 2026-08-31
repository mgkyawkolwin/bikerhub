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
  riderIds?: string[];
  confirmedCount?: number;
  maybeCount?: number;
  createdAtUTC?: string;
  createdById?: string;
  updatedAtUTC?: string;
  updatedById?: string;
}
