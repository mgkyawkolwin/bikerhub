using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Message : BaseEntity<Guid>
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Body { get; set; }
    public DateTime DateTimeUTC { get; set; } = DateTime.UtcNow;
    public bool Read { get; set; }
    public Guid UserId { get; set; }
}
