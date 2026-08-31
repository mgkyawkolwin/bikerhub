using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Api.Entities;

public class PlanRiderEntity : BaseEntity<Guid>
{

    [Required]
    public required Guid PlanId { get; set; }
    [Required]
    public required Guid UserId { get; set; }
    [Required]
    public bool Confirmed { get; set; }
}
