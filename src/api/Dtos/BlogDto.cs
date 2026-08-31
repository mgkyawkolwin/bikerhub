namespace BikerHub.Api.Dtos;

public sealed record BlogDto
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public required string AuthorName { get; set; }
    public required string Content { get; set; }
    public required string CoverImageUrl { get; set; }
    public required Guid PostTypeId { get; set; }
    public required string PostType { get; set; }
    public IEnumerable<MediaDto>? Media { get; set; }
    public DateTime? CreatedAtUtc { get; set; }
    public Guid? CreatedById { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public Guid? UpdatedById { get; set; }
}
