namespace BikerHub.Dtos;

public sealed record UserDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public double? Rating { get; set; }
    public int? RatingCount { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? Token { get; set; }
}