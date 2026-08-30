namespace BikerHub.Api.Dtos;

public sealed record ChatHeadDto(
    Guid Id,
    Guid FriendId,
    string? FriendName,
    string? FriendProfilePictureUrl,
    string? TextMessage,
    string? LatestMediaContentType,
    DateTime MessageDateTimeUTC,
    int UnreadCount
);
