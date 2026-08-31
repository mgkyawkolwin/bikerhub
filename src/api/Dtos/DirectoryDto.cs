namespace BikerHub.Api.Dtos;

public sealed record DirectoryDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? GoogleMapUrl { get; set; }
    public string? BusinessType { get; set; }
    public required Guid CreatedById { get; set; }
    public bool IsFavorited { get; set; }
    public int FavoriteCount { get; set; }
    public double? Rating { get; set; }
    public int? RatingCount { get; set; }
    public double? MyRating { get; set; }
    public DateTime? CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public Guid? UpdatedById { get; set; }
}
