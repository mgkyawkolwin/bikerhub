using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos;

public sealed record CreateGroupDto(
    [property: Required] string Title,
    string? Icon,
    string? Description,
    string? LogoUrl,
    string? CoverPhotoUrl,
    bool IsPrivate = false
);
