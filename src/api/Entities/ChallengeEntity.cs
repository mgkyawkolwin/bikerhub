using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public class Challenge : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(512)]
    public string? CoverImageUrl { get; set; }

    [MaxLength(512)]
    public string? ImageUrl { get; set; }

    public int NoOfParticipants { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public bool IsEnded { get; set; }
    public bool IsStarted { get; set; }
    public virtual ICollection<ChallengeParticipantEntity> Participants { get; set; } = [];
}
