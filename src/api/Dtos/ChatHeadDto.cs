namespace BikerHub.Dtos;

public sealed record ChatHeadDto(
    int Id,
    string FriendId,
    string? FriendName,
    string? FriendProfilePictureUrl,
    string? TextMessage,
    DateTime MessageDateTimeUTC,
    int UnreadCount
);
