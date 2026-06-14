using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("SocialPostLikes")]
public class SocialPostLikeEntity : EntityBase<Guid>
{
    public required Guid PostId { get; set; }
    public required Guid LikedByProfileId { get; set; }
    public DateTime LikedAtUTC { get; set; } = DateTime.UtcNow;
    
    [ForeignKey(nameof(PostId))]
    public virtual SocialPostEntity Post { get; set; } = null!;
    
    [ForeignKey(nameof(LikedByProfileId))]
    public virtual SocialProfileEntity LikedByProfile { get; set; } = null!;
    
}

// DTO for like operations
public record SocialPostLikeDto(
    Guid PostId,
    Guid LikedByProfileId,
    DateTime LikedAtUTC,
    string? LikedByName = null
);