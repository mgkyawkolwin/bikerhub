using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class StolenBikeReportEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(100)]
    public required string Make { get; set; }
    [Required]
    [MaxLength(100)]
    public required string Model { get; set; }
    [MaxLength(100)]
    public string? Edition { get; set; }
    [Required]
    public int Year { get; set; }
    [Required]
    public int Cc { get; set; }
    [Required]
    public int Mileage { get; set; }
    public string? Vin { get; set; }
    [Required]
    public required string Type { get; set; }
    [MaxLength(50)]
    public string? Phone { get; set; }
    [Required]
    [MaxLength(100)]
    public required string City { get; set; }
    [Required]
    [MaxLength(100)]
    public required string Country { get; set; }
    [Required]
    public required DateTime StolenDate { get; set; }
    public string? Description { get; set; }
}
