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
public class FriendRequestEntity : EntityBase<Guid>
{
    [Required]
    public required Guid FromProfileId { get; set; }
    
    [Required]
    public required Guid ToProfileId { get; set; }
    
    [Required]
    public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;
    
    public DateTime? RespondedAtUTC { get; set; }

    [ForeignKey(nameof(FromProfileId))]
    public virtual SocialProfileEntity FromProfile { get; set; } = null!;

    [ForeignKey(nameof(ToProfileId))]
    public virtual SocialProfileEntity ToProfile { get; set; } = null!;
}
