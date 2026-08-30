namespace BikerHub.Api.Dtos;

public sealed record CreateBlogDto(
    string Title,
    string Content,
    string CoverImageUrl,
    BlogPostType PostType = BlogPostType.General
);
