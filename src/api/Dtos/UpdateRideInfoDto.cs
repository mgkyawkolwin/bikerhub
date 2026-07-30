using System.Text.Json.Serialization;

namespace BikerHub.Dtos;

public sealed record UpdateRideInfoDto(
    [property: JsonPropertyName("name")] string? Name = null,
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("bike")] string? Bike = null
);
