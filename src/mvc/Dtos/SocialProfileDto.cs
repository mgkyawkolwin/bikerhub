namespace BikerHub.Dtos;

public sealed record SocialLinkDto(string Platform, string Url);

public sealed record SocialProfileDto(
    int? Id = null,
    string? Name = null,
    string? CoverPhotoUrl = null,
    string? AvatarUrl = null,
    string? Bio = null,
    int FollowersCount = 0,
    int FollowingCount = 0,
    int GarageCount = 0,
    int RidesCount = 0,
    string? GarageDistance = null,
    string? GarageDuration = null,
    string? GarageElevation = null,
    string? RideDistance = null,
    string? RideDuration = null,
    string? RideElevation = null,
    IEnumerable<SocialLinkDto>? SocialLinks = null
);
