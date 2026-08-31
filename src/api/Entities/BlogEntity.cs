using System.ComponentModel.DataAnnotations;
using BikerHub.Api.Dtos;

namespace BikerHub.Api.Entities;

public class BlogEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }
    [Required]
    [MaxLength(20)]
    public required string AuthorName { get; set; }
    [Required]
    public required string Content { get; set; }
    [Required]
    [MaxLength(512)]
    public required string CoverImageUrl { get; set; }
    [Required]
    public required Guid PostTypeId { get; set; }
    public MediaEntity[]? Media { get; set; }
}
