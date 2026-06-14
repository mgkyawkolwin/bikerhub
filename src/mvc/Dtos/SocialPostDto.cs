namespace BikerHub.Dtos;

public sealed record SocialPostDto
{
    public Guid Id { get; set; }
    public bool IsLikedByCurrentUser { get; set; } = false;
    public int LoveCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    public DateTime CreatedAtUTC { get; set; }
    public required Guid CreatedById { get; set; }
    public required string CreatedByName { get; set; }
    public string? Content { get; set; } = null;
    public IEnumerable<string>? ImageUrls { get; set; } = null;
}
