using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class Message : EntityBase<int>
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Body { get; set; }
    public DateTime DateTimeUTC { get; set; } = DateTime.UtcNow;
    public bool Read { get; set; }
    public string? UserId { get; set; }
}
