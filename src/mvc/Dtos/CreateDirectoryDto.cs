using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos;

public sealed record CreateDirectoryDto(
    [property: Required] string Name,
    string? Address,
    string? City,
    string? State,
    string? Phone,
    string? LogoUrl,
    string? CoverImageUrl,
    string? BusinessType
);
