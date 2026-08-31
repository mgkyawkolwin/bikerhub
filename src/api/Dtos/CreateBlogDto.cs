namespace BikerHub.Api.Dtos;

public sealed record CreateBlogDto(
    string Title,
    string AuthorName,
    string Content,
    string CoverImageUrl,
    string PostType
);
