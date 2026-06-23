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
    
    public required Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual UserEntity User { get; set; } = null!;

    public virtual ICollection<SocialPostLikeEntity> Likes { get; set; } = [];
    public virtual ICollection<SocialPostCommentEntity> Comments { get; set; } = [];
}