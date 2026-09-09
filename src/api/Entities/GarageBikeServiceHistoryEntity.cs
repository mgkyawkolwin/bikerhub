using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class GarageBikeServiceHistoryEntity : BaseEntity<Guid>
{
    public Guid GarageBikeId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ServiceType { get; set; } = "Oil";

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public DateTime ServiceDate { get; set; }

    public int Mileage { get; set; }

    public GarageBikeEntity? GarageBike { get; set; }
}
