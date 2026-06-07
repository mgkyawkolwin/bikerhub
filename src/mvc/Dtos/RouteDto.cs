using System;

namespace BikerHub.Dtos;

public sealed record RouteLocationDto(double Latitude, double Longitude, long? Timestamp = null);

public sealed record RouteDto(
    Guid? Id = null,
    string? Name = null,
    string? Description = null,
    decimal? Distance = null,
    decimal? Duration = null,
    string? Type = null,
    string? CreatedById = null,
    string? OsrmResponseJson = null,
    DateTime? CreatedAt = null
);
