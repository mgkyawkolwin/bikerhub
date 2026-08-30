namespace BikerHub.Api.Dtos;

public sealed record ChatMessageDto(
    Guid Id,
    Guid SenderId,
    string? SenderName,
    string? SenderProfilePictureUrl,
    Guid ReceiverId,
    string? ReceiverName,
    string? ReceiverProfilePictureUrl,
    string? TextMessage,
    ChatMessageType MessageType,
    IEnumerable<MediaDto>? Medias,
    DateTime MessageDateTimeUTC,
    bool Sent,
    bool Delivered,
    bool Read
);
