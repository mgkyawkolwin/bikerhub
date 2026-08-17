using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Api.Entities;

[Table("SocialPostMedias")]
public class SocialPostMediaEntity : BaseEntity<Guid>
{
    public required Guid PostId { get; set; }

    [ForeignKey(nameof(PostId))]
    public virtual SocialPostEntity Post { get; set; } = null!;

    // GUID used as the generated name for the stored object
    public required Guid MediaGuid { get; set; }

    // Actual object name stored in Minio (usually MediaGuid + extension)
    public required string ObjectName { get; set; }

    public required string OriginalFileName { get; set; }

    public required string ContentType { get; set; }

    public long Size { get; set; }
}
