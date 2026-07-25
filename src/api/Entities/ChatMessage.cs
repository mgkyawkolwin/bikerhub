using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class ChatMessage : BaseEntity<Guid>
{
    [Required]
    public Guid SenderId { get; set; } = Guid.Empty;

    [Required]
    public Guid ReceiverId { get; set; } = Guid.Empty;

    public string? SenderName { get; set; }
    public string? SenderProfilePictureUrl { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverProfilePictureUrl { get; set; }

    public string? TextMessage { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool Sent { get; set; } = true;
    public bool Delivered { get; set; }
    public bool Read { get; set; }
}
