using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class RatingEntity : BaseEntity<Guid>
{
    [Required]
    public required Guid EntityId { get; set; }

    [Required]
    public required Guid UserId { get; set; }

    [Required]
    [Range(1, 5)]
    public required int Rating { get; set; }

}
