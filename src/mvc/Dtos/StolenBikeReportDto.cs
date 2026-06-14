namespace BikerHub.Dtos;

public sealed record StolenBikeReportDto(
    int? Id = null,
    string? Title = null,
    string? Make = null,
    string? Model = null,
    int? Year = null,
    decimal? Price = null,
    string? Cc = null,
    string? Km = null,
    string? Vin = null,
    string? Type = null,
    string? Description = null,
    IEnumerable<string>? Images = null,
    DateTime? ReportedAt = null,
    string? Location = null,
    int? CreatedById = null,
    DateTime? CreatedAtUTC = null,
    DateTime? UpdatedAtUTC = null,
    int? UpdatedById = null
);
