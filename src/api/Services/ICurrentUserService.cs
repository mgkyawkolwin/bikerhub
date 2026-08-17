using System.Security.Claims;

namespace BikerHub.Api.Services;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? TenantId { get; }
    bool IsAdmin { get; }
    ClaimsPrincipal? User { get; }
}