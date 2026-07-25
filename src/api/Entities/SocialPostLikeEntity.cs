using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("SocialPostLikes")]
public class SocialPostLikeEntity : EntityBase<Guid>
{
    public required Guid PostId { get; set; }
    public required Guid UserId { get; set; }
    public DateTime LikedAtUTC { get; set; } = DateTime.UtcNow;
    
    [ForeignKey(nameof(PostId))]
    public virtual SocialPostEntity Post { get; set; } = null!;
    
    [ForeignKey(nameof(UserId))]
    public virtual UserEntity User { get; set; } = null!;
    
}

// DTO for like operations
public record SocialPostLikeDto(
    Guid PostId,
    Guid UserId,
    DateTime LikedAtUTC,
    string? UserName = null
);