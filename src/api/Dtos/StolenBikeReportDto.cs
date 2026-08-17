namespace BikerHub.Api.Dtos;

public sealed record StolenBikeReportDto(
    Guid Id,
    string? Make = null,
    string? Model = null,
    string? Edition = null,
    int? Year = null,
    int? Cc = null,
    int? Mileage = null,
    string? Vin = null,
    string? Type = null,
    string? Phone = null,
    string? City = null,
    string? Country = null,
    DateTime? StolenDate = null,
    string? Description = null,
    IEnumerable<MediaDto>? Medias = null,
    Guid? CreatedById = null,
    DateTime? CreatedAtUTC = null,
    DateTime? UpdatedAtUTC = null,
    Guid? UpdatedById = null
);
