namespace BikerHub.Api.Dtos;

public sealed record FollowDto
{
    public Guid FollowerId { get; set; }
    public Guid FollowingId { get; set; }
    public DateTime CreatedAtUTC { get; set; }
}

public sealed record FollowResponseDto
{
    public bool IsFollowing { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
}

public sealed record FollowerDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public string? Bio { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
}

public sealed record FollowingDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public string? Bio { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
}
