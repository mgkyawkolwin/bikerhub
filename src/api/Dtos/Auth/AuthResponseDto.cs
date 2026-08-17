namespace BikerHub.Api.Dtos.Auth;

public sealed record AuthResponseDto(
    string Token,
    UserDto User
);
