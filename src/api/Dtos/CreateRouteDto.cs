using System.Text.Json.Serialization;

namespace BikerHub.Dtos;

public sealed record CreateRouteDto(
    [property: JsonPropertyName("name")]
    string? Name,
    [property: JsonPropertyName("description")]
    string? Description,
    [property: JsonPropertyName("distance")]
    decimal Distance,
    [property: JsonPropertyName("duration")]
    decimal Duration,
    [property: JsonPropertyName("createdById")]
    Guid CreatedById,
    [property: JsonPropertyName("osrmResponseJson")]
    string? OsrmResponseJson
);
