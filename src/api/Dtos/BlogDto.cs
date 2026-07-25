namespace BikerHub.Dtos;

public sealed record BlogDto(
    int? Id = null,
    string? Title = null,
    string? Summary = null,
    string? Content = null,
    string? ImageUrl = null,
    string? Author = null,
    DateTime? CreatedAtUTC = null,
    int? CreatedById = null,
    DateTime? UpdatedAtUTC = null,
    int? UpdatedById = null
);
