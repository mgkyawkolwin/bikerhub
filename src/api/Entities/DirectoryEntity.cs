using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace BikerHub.Api.Entities;

public class DirectoryEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(512)]
    public string? LogoUrl { get; set; }

    [MaxLength(512)]
    public string? CoverImageUrl { get; set; }

    [MaxLength(512)]
    public string? GoogleMapUrl { get; set; }

    [MaxLength(100)]
    public string? BusinessType { get; set; }
    public int FavoriteCount { get; set; }
    public double? Rating { get; set; }
    public int? RatingCount { get; set; }

    [NotMapped]
    public bool IsFavorited { get; set; }
    [NotMapped]
    public double? MyRating { get; set; }
}
