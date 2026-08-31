namespace BikerHub.Api.Dtos;

public sealed record NewsDto(
    Guid Id,
    string? Headline = null,
    string? Summary = null,
    string? Content = null,
    string? ImageUrl = null,
    string? Source = null,
    DateTime? CreatedAtUtc = null,
    int? CreatedById = null,
    DateTime? UpdatedAtUtc = null,
    int? UpdatedById = null
);
