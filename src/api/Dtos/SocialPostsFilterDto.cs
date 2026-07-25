using BikerHub.Constants;

namespace BikerHub.Dtos;

public sealed record SocialPostsFilterDto
{
    public PostListTypes List { get; set; } = PostListTypes.Feed;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? UserId { get; set; }
}