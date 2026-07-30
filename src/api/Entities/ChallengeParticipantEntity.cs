using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("ChallengeParticipants")]
public class ChallengeParticipantEntity : BaseEntity<Guid>
{
    public decimal DistanceInKm { get; set; }

    public required Guid ChallengeId { get; set; }

    [ForeignKey(nameof(ChallengeId))]
    public virtual Challenge Challenge { get; set; } = null!;

    public required Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual UserEntity User { get; set; } = null!;
}