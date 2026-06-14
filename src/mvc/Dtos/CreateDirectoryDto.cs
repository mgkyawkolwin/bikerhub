namespace BikerHub.Dtos;

public sealed record CreateDirectoryDto
{
    public required string Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Phone { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? BusinessType { get; set; }
    public required Guid UserId { get; set; }
}
