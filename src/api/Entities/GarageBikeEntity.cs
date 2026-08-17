using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Api.Entities;

public class GarageBikeEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Make { get; set; }

    [MaxLength(50)]
    public string? Model { get; set; }

    public int? Year { get; set; }
    public string? Cc { get; set; }
    public string? Type { get; set; }
    public string? ImagesJson { get; set; }
    public string? Mileage { get; set; }
    public string? Km { get; set; }
    public string? Vin { get; set; }

    [NotMapped]
    public IList<MediaEntity> Medias { get; set; } = [];
}
