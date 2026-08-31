namespace BikerHub.Api.Dtos;

public sealed record MessageDto(
    Guid Id,
    string? Title = null,
    string? Body = null,
    DateTime? CreatedAtUtc = null,
    bool Read = false,
    Guid? CreatedById = null,
    DateTime? UpdatedAtUtc = null,
    Guid? UpdatedById = null
);
