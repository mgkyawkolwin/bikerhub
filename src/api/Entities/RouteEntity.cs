using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class RouteEntity : BaseEntity<Guid>
{

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Distance { get; set; }
    public decimal Duration { get; set; }
    public string? OsrmResponseJson { get; set; }
}
