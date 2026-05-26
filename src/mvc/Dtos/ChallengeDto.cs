namespace BikerHub.Dtos;

public sealed record ChallengeLeaderboardEntryDto(
    int Rank,
    string RiderName,
    int Score
);

public sealed record ChallengeDto(
    int? Id = null,
    string? Title = null,
    string? Description = null,
    string? CoverImageUrl = null,
    string? ImageUrl = null,
    IEnumerable<ChallengeLeaderboardEntryDto>? Leaderboard = null
);
