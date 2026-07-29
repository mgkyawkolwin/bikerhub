using System.Text.Json.Serialization;

namespace BikerHub.Dtos;

public sealed record CreateRideDto(
    [property: JsonPropertyName("name")]
    string Name = null,
    [property: JsonPropertyName("description")]
    string? Description = null,
    [property: JsonPropertyName("distance")]
    decimal Distance = 0,
    [property: JsonPropertyName("duration")]
    decimal Duration = 0,
    [property: JsonPropertyName("createdById")]
    Guid? CreatedById = null,
    [property: JsonPropertyName("averageSpeed")]
    decimal AverageSpeed = 0,
    [property: JsonPropertyName("totalElevation")]
    decimal TotalElevation = 0,
    [property: JsonPropertyName("minSpeed")]
    decimal MinSpeed = 0,
    [property: JsonPropertyName("maxSpeed")]
    decimal MaxSpeed = 0,
    [property: JsonPropertyName("minElevation")]
    decimal MinElevation = 0,
    [property: JsonPropertyName("maxElevation")]
    decimal MaxElevation = 0,
    [property: JsonPropertyName("locations")]
    IEnumerable<RideLocationDto>? Locations = null
);
