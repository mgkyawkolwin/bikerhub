namespace BikerHub.Api.Dtos;

public sealed record GroupDto(
    Guid Id,
    string? Title = null,
    string? Icon = null,
    string? Description = null,
    string? LogoUrl = null,
    string? CoverPhotoUrl = null,
    bool IsPrivate = false,
    int MembersCount = 0,
    int? CreatedById = null,
    DateTime? CreatedAtUtc = null,
    DateTime? UpdatedAtUtc = null,
    int? UpdatedById = null
);
