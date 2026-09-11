namespace BikerHub.Api.Dtos;

public sealed record BikeListingDto
{
    public required Guid Id { get; set; }
    public required string Make { get; set; }
    public required string Model { get; set; }
    public required string Edition { get; set; }
    public required int Year { get; set; }
    public required decimal Price { get; set; }
    public required string Cc { get; set; }
    public required string Type { get; set; }
    public required string Mileage { get; set; }
    public required Guid SellerId { get; set; }
    public required string SellerName { get; set; }
    public string? SellerPhone { get; set; }
    public required string SellerCity { get; set; }
    public required string SellerCountry { get; set; }
    public required double Rating { get; set; }
    public required int RatingCount { get; set; }
    public double? MyRating { get; set; }
    public string? Vin { get; set; }
    public string? Description { get; set; }
    public required int FavoritesCount { get; set; }
    public required int LikeCount { get; set; }
    public required int ViewCount { get; set; }
    public required bool IsSold { get; set; }
    public required bool IsReported { get; set; }
    public required bool IsFavorite { get; set; }
    public required bool IsLiked { get; set; }
    public string ShareUrl { get; set; } = string.Empty;
    public List<MediaDto>? Medias { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required Guid CreatedById { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
    public required Guid UpdatedById { get; set; }
}
