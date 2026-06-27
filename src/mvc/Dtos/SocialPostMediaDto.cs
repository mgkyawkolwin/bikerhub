namespace BikerHub.Dtos;

public sealed record SocialPostMediaDto
{
    public required Guid Id { get; set; }
    public required Guid MediaGuid { get; set; }
    public required string ObjectName { get; set; }
    public required string ContentType { get; set; }
    public string? Url { get; set; }
}
