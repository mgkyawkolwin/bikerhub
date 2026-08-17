namespace BikerHub.Api.Dtos;

public sealed record CreateBlogDto(
    string Title,
    string? Summary,
    string? Content,
    string? ImageUrl,
    string? Author
);
