using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class RideEntity : BaseEntity<Guid>
{

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public decimal Distance { get; set; }
    public decimal Duration { get; set; }
    public decimal AverageSpeed { get; set; }
    public decimal TotalElevation { get; set; }
    public decimal MinSpeed { get; set; }
    public decimal MaxSpeed { get; set; }
    public decimal MinElevation { get; set; }
    public decimal MaxElevation { get; set; }
    public string LocationsJson { get; set; } = string.Empty;
}
