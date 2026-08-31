namespace BikerHub.Api.Dtos;

public sealed record PlanDto
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required decimal Distance { get; set; }
    public required decimal Duration { get; set; }
    public required decimal Elevation { get; set; }
    public required DateTime TripDateTimeUtc { get; set; }
    public string? LocationsJson { get; set; }
    public string? StaticMapUrl { get; set; }
    public IEnumerable<Guid>? RiderIds { get; set; }
    public int ConfirmedCount { get; set; }
    public int MaybeCount { get; set; }
    public DateTime CreatedAtUTC { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime UpdatedAtUTC { get; set; }
    public Guid UpdatedById { get; set; }
}
