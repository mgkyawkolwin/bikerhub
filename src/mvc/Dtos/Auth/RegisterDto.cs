using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos.Auth;

public sealed record RegisterDto(
    [property: Required] string Name,
    [property: Required][property: EmailAddress] string Email,
    [property: Required] string Password
);
