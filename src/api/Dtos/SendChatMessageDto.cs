namespace BikerHub.Api.Dtos;

public sealed record SendChatMessageDto(
    Guid ReceiverId,
    ChatMessageType MessageType,
    string? TextMessage = null
);
