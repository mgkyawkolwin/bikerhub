using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Group : BaseEntity<Guid>
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Icon { get; set; }

    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public bool IsPrivate { get; set; }
    public int MembersCount { get; set; }
}
