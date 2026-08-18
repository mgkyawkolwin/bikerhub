namespace BikerHub.Api.Dtos;

public sealed record StolenBikeReportFilterDto(
    int Page = 1,
    int PageSize = 10,
    string? Make = null,
    string? Model = null,
    int? Year = null,
    int? Cc = null,
    string? Type = null,
    string? City = null,
    string? Country = null,
    DateTime? StolenDate = null
);
