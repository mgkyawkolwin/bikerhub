using System.Collections.Generic;

namespace BikerHub.Api.Dtos;

public sealed record RouteStaticMapDto(
    IEnumerable<RouteLocationDto>? Waypoints,
    int Width = 640,
    int Height = 320,
    int Scale = 2,
    string? EncodedPolyline = null
);
