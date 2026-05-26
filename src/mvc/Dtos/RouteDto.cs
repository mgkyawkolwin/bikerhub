namespace BikerHub.Dtos;

public sealed record RouteLocationDto(double Latitude, double Longitude, long? Timestamp = null);

public sealed record RouteDto(
    int? Id = null,
    string? Name = null,
    string? Description = null,
    string? Distance = null,
    string? Duration = null,
    string? Type = null,
    string? CreatedById = null,
    string? CreatedByName = null,
    string? GpxUrl = null,
    IEnumerable<RouteLocationDto>? Locations = null,
    IEnumerable<RouteLocationDto>? RoutePath = null,
    string? OsrmResponseJson = null,
    DateTime? CreatedAt = null
);
