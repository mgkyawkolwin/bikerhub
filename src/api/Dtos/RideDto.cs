using System.Text.Json.Serialization;

namespace BikerHub.Dtos;

public sealed record RideLocationDto(
    [property: JsonPropertyName("latitude")]
    double Latitude,
    [property: JsonPropertyName("longitude")]
    double Longitude,
    [property: JsonPropertyName("timestamp")]
    long? Timestamp = null,
    [property: JsonPropertyName("elevation")]
    double? Elevation = null,
    [property: JsonPropertyName("speed")]
    double? Speed = null
);

public sealed record RideDto(
    Guid Id,
    string? Name = null,
    string? Description = null,
    string? Bike = null,
    decimal Distance = 0,
    decimal Duration = 0,
    decimal AverageSpeed = 0,
    decimal TotalElevation = 0,
    decimal MinSpeed = 0,
    decimal MaxSpeed = 0,
    decimal MinElevation = 0,
    decimal MaxElevation = 0,
    Guid? CreatedById = null,
    IEnumerable<RideLocationDto>? Locations = null,
    IEnumerable<MediaDto>? Medias = null,
    DateTime? CreatedAtUTC = null,
    DateTime? UpdatedAtUTC = null,
    Guid? UpdatedById = null
);
