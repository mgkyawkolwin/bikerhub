using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos;

public sealed record SendChatMessageDto(
    [property: Required] string ReceiverId,
    [property: Required] string TextMessage
);
