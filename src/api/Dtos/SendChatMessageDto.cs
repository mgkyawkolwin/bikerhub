namespace BikerHub.Dtos;

public sealed record SendChatMessageDto(
    Guid ReceiverId,
    string TextMessage
);
