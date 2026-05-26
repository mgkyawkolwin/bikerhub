using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Route
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string? Distance { get; set; }
    public string? Duration { get; set; }
    public string? Type { get; set; }
    public string? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    [MaxLength(512)]
    public string? GpxUrl { get; set; }
    public string? LocationsJson { get; set; }
    public string? RoutePathJson { get; set; }
    public string? OsrmResponseJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
