using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos;

public sealed record CreateBlogDto(
    [property: Required] string Title,
    string? Summary,
    string? Content,
    string? ImageUrl,
    string? Author
);
