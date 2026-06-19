using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("Posts")]
public class SocialPostEntity : EntityBase<Guid>
{
    public string? Content { get; set; }
    public string? ImageUrlsJson { get; set; }
    public int LoveCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    
    public required Guid SocialProfileId { get; set; }

    [ForeignKey(nameof(SocialProfileId))]
    public virtual SocialProfileEntity SocialProfile { get; set; } = null!;

    public virtual ICollection<SocialPostLikeEntity> Likes { get; set; } = [];
    public virtual ICollection<SocialPostCommentEntity> Comments { get; set; } = [];
}