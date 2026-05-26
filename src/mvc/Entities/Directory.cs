using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Directory
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(512)]
    public string? LogoUrl { get; set; }

    [MaxLength(512)]
    public string? CoverImageUrl { get; set; }

    [MaxLength(100)]
    public string? BusinessType { get; set; }

    public string? CreatedById { get; set; }
    public bool IsLiked { get; set; }
    public int LikesCount { get; set; }
    public double? Rating { get; set; }
    public int? RatingCount { get; set; }
    public double? MyRating { get; set; }
}
