namespace BikerHub.Api.Dtos;

public sealed record SocialPostDto
{
    public Guid Id { get; set; }
    public bool IsLikedByCurrentUser { get; set; } = false;
    public int LoveCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    public DateTime CreatedAtUTC { get; set; }
    public required Guid CreatedByUserId { get; set; }
    public required string CreatedByDisplayName { get; set; }
    public required string CreatedByUserName { get; set; }
    public string? CreatedByUserProfilePhotoUrl { get; set; }
    public string? Content { get; set; } = null;
    public IEnumerable<SocialPostMediaDto>? Medias { get; set; } = null;
}

