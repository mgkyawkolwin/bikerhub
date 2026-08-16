using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class BikeListing : BaseEntity<Guid>
{

    [MaxLength(100)]
    public string? Make { get; set; }

    [MaxLength(100)]
    public string? Model { get; set; }

    [MaxLength(50)]
    public string? Edition { get; set; }

    public int? Year { get; set; }
    public decimal? Price { get; set; }
    public string? Cc { get; set; }
    public string? Type { get; set; }
    public string? SellerId { get; set; }
    public string? SellerName { get; set; }
    public string? Location { get; set; }
    public double? Rating { get; set; }
    public int RatingCount { get; set; }
    public string? Phone { get; set; }
    public string? Mileage { get; set; }
    public string? Km { get; set; }
    public string? Vin { get; set; }
    public string? Description { get; set; }
    public int FavoritesCount { get; set; }
    public bool IsFavorite { get; set; }
    public bool IsLiked { get; set; }
    public int LikeCount { get; set; }
    public int ViewCount { get; set; }
}
