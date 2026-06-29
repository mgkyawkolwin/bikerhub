using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Entities;

public class SocialProfileEntity : EntityBase<Guid>
{
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual UserEntity User { get; set; } = null!;

    [MaxLength(512)]
    public string? CoverPhotoUrl { get; set; }

    [MaxLength(512)]
    public string? ProfilePhotoUrl { get; set; }

    public string? Bio { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int GarageCount { get; set; }
    public int RidesCount { get; set; }
    public string? GarageDistance { get; set; }
    public string? GarageDuration { get; set; }
    public string? GarageElevation { get; set; }
    public string? RideDistance { get; set; }
    public string? RideDuration { get; set; }
    public string? RideElevation { get; set; }
    public string SocialLinksJson { get; set; } = "[]";
    public virtual ICollection<SocialPostEntity> Posts { get; set; } = [];
    public virtual ICollection<UserEntity> Friends { get; set; } = [];
    public virtual ICollection<UserEntity> Followers { get; set; } = [];
    public virtual ICollection<UserEntity> Following { get; set; } = [];
}
