using System.Text.Json.Serialization;

namespace BikerHub.Dtos;

public sealed record RideLocationDto(
    [property: JsonPropertyName("latitude")]
    double Latitude,
    [property: JsonPropertyName("longitude")]
    double Longitude,
    [property: JsonPropertyName("timestamp")]
    long? Timestamp = null
);

public sealed record RideDto(
    Guid Id,
    string? Name = null,
    string? Description = null,
    decimal? Distance = null,
    decimal? Duration = null,
    Guid? CreatedById = null,
    IEnumerable<RideLocationDto>? Locations = null,
    DateTime? CreatedAtUTC = null,
    DateTime? UpdatedAtUTC = null,
    Guid? UpdatedById = null
);
