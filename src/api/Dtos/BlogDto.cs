namespace BikerHub.Api.Dtos;

public sealed record BlogDto(
    Guid Id,
    string Title,
    string Content,
    string CoverImageUrl,
    BlogPostType PostType,
    IEnumerable<MediaDto>? Media = null,
    DateTime? CreatedAtUTC = null,
    Guid? CreatedById = null,
    DateTime? UpdatedAtUTC = null,
    Guid? UpdatedById = null
);
