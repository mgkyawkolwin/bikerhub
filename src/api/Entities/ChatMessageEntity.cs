using System.ComponentModel.DataAnnotations;
using BikerHub.Api.Dtos;

namespace BikerHub.Api.Entities;

public class ChatMessage : BaseEntity<Guid>
{
    [Required]
    public Guid SenderId { get; set; } = Guid.Empty;
    [Required]
    public Guid ReceiverId { get; set; } = Guid.Empty;
    public string? TextMessage { get; set; }
    public ChatMessageType MessageType { get; set; } = ChatMessageType.Text;
    public bool Sent { get; set; } = true;
    public bool Delivered { get; set; }
    public bool Read { get; set; }
}
