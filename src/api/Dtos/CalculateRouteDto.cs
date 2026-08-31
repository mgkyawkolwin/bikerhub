using System.Collections.Generic;

namespace BikerHub.Api.Dtos;

public sealed record CalculateRouteDto(
    IEnumerable<RouteLocationDto> Waypoints
);
