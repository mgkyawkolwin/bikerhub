using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class RideEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public decimal Distance { get; set; }
    public decimal Duration { get; set; }
    public string? CreatedById { get; set; }
    public string? LocationsJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
