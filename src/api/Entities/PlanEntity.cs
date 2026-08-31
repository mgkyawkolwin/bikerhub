using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Api.Entities;

public class PlanEntity : BaseEntity<Guid>
{

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }
    [Required]
    [MaxLength(500)]
    public required string Description { get; set; }
    [Required]
    public decimal Distance { get; set; }
    [Required]
    public decimal Duration { get; set; }
    [Required]
    public decimal Elevation { get; set; }
    [Required]
    public DateTime TripDateTimeUtc { get; set; }
    public string LocationsJson { get; set; } = string.Empty;
    public PlanRiderEntity[]? Riders { get; set; }
}
