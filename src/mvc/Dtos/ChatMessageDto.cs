namespace BikerHub.Dtos;

public sealed record ChatMessageDto(
    int? Id,
    string? SenderId,
    string? SenderName,
    string? SenderProfilePictureUrl,
    string? ReceiverId,
    string? ReceiverName,
    string? ReceiverProfilePictureUrl,
    string? TextMessage,
    DateTime? MessageDateTimeUTC,
    bool Sent,
    bool Delivered,
    bool Read
);
