namespace BikerHub.Api.Dtos;

public sealed record CreatePostCommentDto
{
    public required Guid PostId { get; init; }
    public Guid? ParentCommentId { get; init; }
    public required string Content { get; init; }
}
