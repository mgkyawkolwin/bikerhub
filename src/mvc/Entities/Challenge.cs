using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Challenge
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(512)]
    public string? CoverImageUrl { get; set; }

    [MaxLength(512)]
    public string? ImageUrl { get; set; }

    public string LeaderboardJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
