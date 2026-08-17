namespace BikerHub.Api.Dtos;

public sealed record SendChatMessageDto(
    Guid ReceiverId,
    string TextMessage
);
