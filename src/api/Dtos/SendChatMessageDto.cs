namespace BikerHub.Api.Dtos;

public sealed record SendChatMessageDto(
    Guid ReceiverId,
    string MessageType,
    string? TextMessage = null
);
