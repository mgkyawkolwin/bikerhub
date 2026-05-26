using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class SocialProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(512)]
    public string CoverPhotoUrl { get; set; } = string.Empty;

    [MaxLength(512)]
    public string AvatarUrl { get; set; } = string.Empty;

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
}
