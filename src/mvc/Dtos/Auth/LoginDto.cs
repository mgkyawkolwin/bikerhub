using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos.Auth;

public sealed record LoginDto(
    [property: Required][property: EmailAddress] string Email,
    [property: Required] string Password
);
