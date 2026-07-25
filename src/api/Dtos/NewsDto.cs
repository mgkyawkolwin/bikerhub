namespace BikerHub.Dtos;

public sealed record NewsDto(
    int? Id = null,
    string? Headline = null,
    string? Summary = null,
    string? Content = null,
    string? ImageUrl = null,
    string? Source = null,
    DateTime? CreatedAtUTC = null,
    int? CreatedById = null,
    DateTime? UpdatedAtUTC = null,
    int? UpdatedById = null
);
