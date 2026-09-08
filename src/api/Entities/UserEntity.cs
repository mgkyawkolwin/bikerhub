using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BikerHub.Api.Entities;

[Table("Users")]
public class UserEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(20)]
    public string UserName { get; set; } = string.Empty;
    [Required]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    public double? Rating { get; set; }

    public int? RatingCount { get; set; }

    [MaxLength(512)]
    public string? ProfilePictureUrl { get; set; }

    [MaxLength(32)]
    public string? Phone { get; set; }

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

}
