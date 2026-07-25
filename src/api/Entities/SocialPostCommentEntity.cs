using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("SocialPostComments")]
public class SocialPostCommentEntity : BaseEntity<Guid>
{
    public required Guid PostId { get; set; }
    public required Guid UserId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Content { get; set; } = string.Empty;

    [ForeignKey(nameof(PostId))]
    public virtual SocialPostEntity Post { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual UserEntity User { get; set; } = null!;

    [ForeignKey(nameof(ParentCommentId))]
    public virtual SocialPostCommentEntity? ParentComment { get; set; }
    public virtual ICollection<SocialPostCommentEntity> Replies { get; set; } = new List<SocialPostCommentEntity>();
}
