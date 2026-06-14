namespace BikerHub.Dtos;

public sealed record MessageDto(
    int? Id = null,
    string? Title = null,
    string? Body = null,
    DateTime? CreatedAtUTC = null,
    bool Read = false,
    int? CreatedById = null,
    DateTime? UpdatedAtUTC = null,
    int? UpdatedById = null
);
