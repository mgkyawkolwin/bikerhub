using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

[Table("Medias")]
public class MediaEntity : BaseEntity<Guid>
{
    public required Guid OwnerId { get; set; }
    public required string ObjectName { get; set; }
    public required string ContentType { get; set; }
    public long Size { get; set; }
}
