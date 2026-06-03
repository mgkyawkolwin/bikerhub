namespace BikerHub.Dtos.Auth;

public sealed record RegisterDto(
    string Name,
    string? Email,
    string Password,
    string? Phone
);
