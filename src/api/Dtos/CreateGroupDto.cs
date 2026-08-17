namespace BikerHub.Api.Dtos;

public sealed record CreateGroupDto(
    string Title,
    string? Icon,
    string? Description,
    string? LogoUrl,
    string? CoverPhotoUrl,
    bool IsPrivate = false
);
