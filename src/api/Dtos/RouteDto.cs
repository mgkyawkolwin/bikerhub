namespace BikerHub.Api.Dtos;

public sealed record RouteLocationDto(double Latitude, double Longitude, long? Timestamp = null);

public sealed record RouteDto{
    public Guid Id {get; init; }
    public string? Name {get; set;}
    public string? Description {get; set;}
    public decimal? Distance {get; set;}
    public decimal? Duration {get; set;}
    public string? Type {get; set;}
    public string? OsrmResponseJson {get; set;}
    public DateTime CreatedAtUtc {get; set;}
    public Guid CreatedById {get; set;}
    public DateTime UpdatedAtUtc {get; set;}
    public Guid UpdatedById {get; set;}
}
