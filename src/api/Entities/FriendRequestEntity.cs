using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

public enum FriendRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

[Table("FriendRequests")]
public class FriendRequestEntity : BaseEntity<Guid>
{
    [Required]
    public required Guid FromUserId { get; set; }
    
    [Required]
    public required Guid ToUserId { get; set; }
    
    [Required]
    public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;
    
    public DateTime? RespondedAtUTC { get; set; }

    [ForeignKey(nameof(FromUserId))]
    public virtual UserEntity FromUser { get; set; } = null!;

    [ForeignKey(nameof(ToUserId))]
    public virtual UserEntity ToUser { get; set; } = null!;
}
