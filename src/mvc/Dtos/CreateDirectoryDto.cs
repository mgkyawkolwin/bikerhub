namespace BikerHub.Dtos;

public sealed record CreateDirectoryDto(
    string Name,
    string? Address,
    string? City,
    string? State,
    string? Phone,
    string? LogoUrl,
    string? CoverImageUrl,
    string? BusinessType
);
