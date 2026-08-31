namespace BikerHub.Api.Dtos;

public sealed record CreatePlanDto(
    string Title,
    string Description,
    decimal Distance,
    decimal Duration,
    decimal Elevation,
    DateTime TripDateTimeUtc,
    string? LocationsJson = null
);
