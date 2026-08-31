namespace BikerHub.Api.Dtos;

public sealed record SocialPostCommentDto
{
    public required Guid Id { get; init; }
    public required Guid PostId { get; init; }
    public Guid? ParentCommentId { get; init; }
    public required string Content { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required Guid CreatedById { get; init; }
    public required string CreatedByName { get; init; }
    public List<SocialPostCommentDto> Replies { get; init; } = new();
}
