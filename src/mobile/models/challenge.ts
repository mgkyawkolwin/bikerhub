export interface ChallengeLeaderboardEntry {
  rank: number;
  riderName: string;
  score: number;
}

export default interface Challenge {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  imageUrl?: string;
  leaderboard: ChallengeLeaderboardEntry[];
  noOfParticipants?: number;
  isStarted?: boolean;
  isEnded?: boolean;
  startDate?: string;
  endDate?: string;
  isJoined?: boolean;
}
