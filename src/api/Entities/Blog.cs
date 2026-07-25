using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Blog : EntityBase<int>
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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
