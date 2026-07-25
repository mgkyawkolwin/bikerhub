using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class LookUpEntity : BaseEntity<Guid>
{
    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? Value { get; set; }
}
