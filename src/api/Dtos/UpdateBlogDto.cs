namespace BikerHub.Api.Dtos;

public sealed record UpdateBlogDto(
    string? Title,
    string? AuthorName,
    string? Content,
    string? CoverImageUrl,
    string? PostType = null
);
