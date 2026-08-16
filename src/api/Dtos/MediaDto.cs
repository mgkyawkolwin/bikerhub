
namespace BikerHub.Dtos;

public sealed record MediaDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public required string ObjectName { get; set; }
    public required string ContentType { get; set; }
    public long Size { get; set; }
    public string? Url { get; set; }
}
