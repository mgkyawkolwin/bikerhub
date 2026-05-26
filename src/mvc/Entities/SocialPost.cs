using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class SocialPost
{
    [Key]
    public int Id { get; set; }

    public string? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string? GroupId { get; set; }
    public string? Content { get; set; }
    public string? ImageUrlsJson { get; set; }
    public int LoveCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
