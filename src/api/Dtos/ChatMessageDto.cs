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
    DateTime MessageDateTimeUTC,
    bool Sent,
    bool Delivered,
    bool Read
);
