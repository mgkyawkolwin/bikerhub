namespace BikerHub.Dtos;

public sealed record SendChatMessageDto(
    string ReceiverId,
    string TextMessage
);
