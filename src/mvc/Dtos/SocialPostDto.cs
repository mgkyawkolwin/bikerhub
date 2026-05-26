namespace BikerHub.Dtos;

public sealed record SocialPostDto(
    int? Id = null,
    string? AuthorId = null,
    string? AuthorName = null,
    string? AuthorAvatarUrl = null,
    string? GroupId = null,
    string? Content = null,
    IEnumerable<string>? ImageUrls = null,
    int LoveCount = 0,
    int CommentCount = 0,
    int ShareCount = 0,
    DateTime? CreatedAt = null
);
