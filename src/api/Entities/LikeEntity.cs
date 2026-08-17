using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class LikeEntity : BaseEntity<Guid>
{
    [Required]
    public required Guid EntityId { get; set; }

    [Required]
    public required Guid UserId { get; set; }

}
