namespace BikerHub.Api.Dtos;

public sealed record FriendRequestDto
{
    public Guid Id { get; set; }
    public Guid FromProfileId { get; set; }
    public Guid ToProfileId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? RespondedAtUtc { get; set; }
}

public sealed record SendFriendRequestDto
{
    public required Guid ToProfileId { get; set; }
}

public sealed record FriendRequestResponseDto
{
    public Guid RequestId { get; set; }
    public bool Success { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public sealed record PendingFriendRequestDto
{
    public Guid Id { get; set; }
    public Guid FromProfileId { get; set; }
    public Guid FromUserId { get; set; }
    public string FromUserName { get; set; } = string.Empty;
    public string FromDisplayName { get; set; } = string.Empty;
    public string? FromProfilePictureUrl { get; set; }
    public string? FromCoverPhotoUrl { get; set; }
    public string? FromBio { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
