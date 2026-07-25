namespace BikerHub.Dtos;

public sealed record ChallengeLeaderboardEntryDto(
    int Rank,
    string RiderName,
    string? ProfileImageUrl,
    decimal Km
);

public sealed record ChallengeDto(
    Guid? Id = null,
    string? Title = null,
    string? Description = null,
    string? CoverImageUrl = null,
    string? ImageUrl = null,
    IEnumerable<ChallengeLeaderboardEntryDto>? Leaderboard = null,
    int? NoOfParticipants = null,
    bool? IsStarted = null,
    bool? IsEnded = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    bool? IsJoined = null,
    DateTime? CreatedAtUTC = null,
    DateTime? UpdatedAtUTC = null
);
