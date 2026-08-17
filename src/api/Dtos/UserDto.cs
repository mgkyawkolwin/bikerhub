namespace BikerHub.Api.Dtos;

public sealed record UserDto
{
    public Guid Id { get; set; }
    public string? DisplayName { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public double? Rating { get; set; }
    public int? RatingCount { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? Token { get; set; }
}

public sealed record CreateUserDto
{
    public string UserName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? ProfilePictureUrl { get; init; }
    public double? Rating { get; init; }
    public int? RatingCount { get; init; }
}

public sealed record UpdateUserDto
{
    public string? UserName { get; init; }
    public string? DisplayName { get; init; }
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? ProfilePictureUrl { get; init; }
    public double? Rating { get; init; }
    public int? RatingCount { get; init; }
}