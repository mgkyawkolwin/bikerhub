namespace BikerHub.Dtos;

public sealed record MessageDto(
    int? Id = null,
    string? Title = null,
    string? Body = null,
    DateTime? DateTimeUTC = null,
    bool Read = false
);
