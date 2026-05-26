namespace BikerHub.Dtos;

public sealed record UserDto(
    int? Id = null,
    string? Name = null,
    string? Email = null,
    string? Address = null,
    string? City = null,
    double? Rating = null,
    int? RatingCount = null,
    string? ProfilePictureUrl = null,
    string? Token = null
);
