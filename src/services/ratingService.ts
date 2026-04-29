export const RatingServiceToken = Symbol('RatingService');

export type RatingInfo = {
  value: number;
  count: number;
};

export interface RatingService {
  getRating(listingId: string): Promise<RatingInfo>;
  submitRating(listingId: string, rating: number): Promise<RatingInfo>;
}
