using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class StolenBikeReport : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Make { get; set; }

    [MaxLength(100)]
    public string? Model { get; set; }

    public int? Year { get; set; }
    public decimal? Price { get; set; }
    public string? Cc { get; set; }
    public string? Km { get; set; }
    public string? Vin { get; set; }
    public string? Type { get; set; }
    public string? Description { get; set; }
    public string? ImagesJson { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public string? Location { get; set; }
}
