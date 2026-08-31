namespace BikerHub.Api.Dtos;

public sealed record UpdatePlanDto(
    string? Title,
    string? Description,
    decimal? Distance = null,
    decimal? Duration = null,
    decimal? Elevation = null,
    DateTime? TripDateTimeUtc = null,
    string? LocationsJson = null
);
