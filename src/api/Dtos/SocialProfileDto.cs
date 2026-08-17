namespace BikerHub.Api.Dtos;

public sealed record SocialLinkDto(string Platform, string Url);
public sealed record UpdateSocialLinksDto(IEnumerable<SocialLinkDto> SocialLinks);

public sealed record SocialProfileDto
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public required string UserName { get; set; }
    public required string DisplayName { get; set; }
    public string? CoverPhotoUrl { get; set; } = null;
    public string? ProfilePhotoUrl { get; set; } = null;
    public string? AvatarUrl { get; set; } = null;
    public string? Bio { get; set; } = null;
    public int FollowersCount { get; set; } = 0;
    public int FollowingCount { get; set; } = 0;
    public int GarageCount { get; set; } = 0;
    public int RidesCount { get; set; } = 0;
    public string? GarageDistance { get; set; } = null;
    public string? GarageDuration { get; set; } = null;
    public string? GarageElevation { get; set; } = null;
    public string? RideDistance { get; set; } = null;
    public string? RideDuration { get; set; } = null;
    public string? RideElevation { get; set; } = null;
    public IEnumerable<SocialLinkDto>? SocialLinks { get; set; } = null;
    public bool IsFriend { get; set; }
    public bool IsFriendRequestPending { get; set; }
    public bool IsFollowing { get; set; }
}
