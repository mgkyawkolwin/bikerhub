using BikerHub.Constants;

namespace BikerHub.Dtos;

public sealed record SocialPostsFilterDto
{
    public PostListTypes List { get; init; } = PostListTypes.Feed;
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public Guid? UserId { get; init; }
}