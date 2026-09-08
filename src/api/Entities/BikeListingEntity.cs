using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class BikeListingEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(100)]
    public required string Make { get; set; }
    [Required]
    [MaxLength(100)]
    public required string Model { get; set; }
    [Required]
    [MaxLength(50)]
    public required string Edition { get; set; }
    [Required]
    public int Year { get; set; }
    [Required]
    public decimal Price { get; set; }
    [Required]
    public required string Cc { get; set; }
    [Required]
    public required string Type { get; set; }
    public string? SellerPhone { get; set; }
    [Required]
    public required string SellerCity { get; set; }
    [Required]
    public required string SellerCountry { get; set; }
    [Required]
    public double Rating { get; set; }
    [Required]
    public int RatingCount { get; set; }
    [Required]
    public required string Mileage { get; set; }
    public string? Vin { get; set; }
    public string? Description { get; set; }
    [Required]
    public int FavoritesCount { get; set; }
    [Required]
    public int LikeCount { get; set; }
    [Required]
    public int ViewCount { get; set; }
    [Required]
    public bool IsSold { get; set; }
}
