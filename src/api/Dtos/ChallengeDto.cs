namespace BikerHub.Api.Dtos;

public sealed record ChallengeLeaderboardEntryDto(
    int Rank,
    string RiderName,
    string? ProfileImageUrl,
    decimal Km
);

public sealed record ChallengeDto(
    Guid Id,
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

public sealed record CreateChallengeDto
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public int NoOfParticipants { get; init; }
}

public sealed record UpdateChallengeDto
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int? NoOfParticipants { get; init; }
}
