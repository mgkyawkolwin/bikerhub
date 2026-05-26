namespace BikerHub.Dtos;

public sealed record DirectoryDto(
    int? Id = null,
    string? Name = null,
    string? Address = null,
    string? City = null,
    string? State = null,
    string? Phone = null,
    string? LogoUrl = null,
    string? CoverImageUrl = null,
    string? BusinessType = null,
    string? CreatedById = null,
    bool IsLiked = false,
    int LikesCount = 0,
    double? Rating = null,
    int? RatingCount = null,
    double? MyRating = null
);
