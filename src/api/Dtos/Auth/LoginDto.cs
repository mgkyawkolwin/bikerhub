namespace BikerHub.Api.Dtos.Auth;

public sealed record LoginDto(
    string Username,
    string Password
);
