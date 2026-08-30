namespace BikerHub.Api.Dtos;

public sealed record UpdateBlogDto(
    string? Title,
    string? Content,
    string? CoverImageUrl,
    BlogPostType? PostType = null
);
