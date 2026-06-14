using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class News : EntityBase<int>
{
    [Required]
    [MaxLength(200)]
    public string Headline { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Summary { get; set; }

    public string? Content { get; set; }
    [MaxLength(512)]
    public string? ImageUrl { get; set; }
    [MaxLength(200)]
    public string? Source { get; set; }
    public DateTime DateTimeUTC { get; set; } = DateTime.UtcNow;
}
