using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public class ChatMessage : EntityBase<int>
{
    [Required]
    public string SenderId { get; set; } = string.Empty;

    [Required]
    public string ReceiverId { get; set; } = string.Empty;

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
