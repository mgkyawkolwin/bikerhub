namespace BikerHub.Dtos;

public sealed record GroupDto(
    int? Id = null,
    string? Title = null,
    string? Icon = null,
    string? Description = null,
    string? LogoUrl = null,
    string? CoverPhotoUrl = null,
    bool IsPrivate = false,
    int MembersCount = 0,
    int? CreatedById = null,
    DateTime? CreatedAtUTC = null,
    DateTime? UpdatedAtUTC = null,
    int? UpdatedById = null
);
