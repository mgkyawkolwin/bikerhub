using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class Blog : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Summary { get; set; }

    public string? Content { get; set; }

    [MaxLength(512)]
    public string? ImageUrl { get; set; }

    [MaxLength(100)]
    public string? Author { get; set; }
}
