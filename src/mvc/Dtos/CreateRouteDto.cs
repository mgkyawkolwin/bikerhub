using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos;

public sealed record CreateRouteDto(
    [property: Required] string Name,
    string? Description,
    string? Distance,
    string? Duration,
    string? Type,
    string? CreatedById,
    string? CreatedByName,
    string? GpxUrl,
    IEnumerable<RouteLocationDto>? Locations,
    IEnumerable<RouteLocationDto>? RoutePath,
    string? OsrmResponseJson
);
