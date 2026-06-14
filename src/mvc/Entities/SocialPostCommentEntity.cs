using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("SocialPostComments")]
public class SocialPostCommentEntity : EntityBase<Guid>
{
    public required Guid PostId { get; set; }
    public required Guid CreatedByProfileId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAtUTC { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(PostId))]
    public virtual SocialPostEntity Post { get; set; } = null!;

    [ForeignKey(nameof(CreatedByProfileId))]
    public virtual SocialProfileEntity CreatedByProfile { get; set; } = null!;

    [ForeignKey(nameof(ParentCommentId))]
    public virtual SocialPostCommentEntity? ParentComment { get; set; }
    public virtual ICollection<SocialPostCommentEntity> Replies { get; set; } = new List<SocialPostCommentEntity>();
}
