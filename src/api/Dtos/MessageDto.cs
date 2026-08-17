namespace BikerHub.Api.Dtos;

public sealed record MessageDto(
    Guid Id,
    string? Title = null,
    string? Body = null,
    DateTime? CreatedAtUTC = null,
    bool Read = false,
    Guid? CreatedById = null,
    DateTime? UpdatedAtUTC = null,
    Guid? UpdatedById = null
);
