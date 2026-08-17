using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BikerHub.Api.Constants;
using BikerHub.Api.Services;

namespace BikerHub.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                             ?? User?.FindFirstValue("sub");

    public string? TenantId => User?.FindFirst(CustomClaimTypes.TenantId)?.Value;

    public bool IsAdmin => bool.TryParse(User?.FindFirst(CustomClaimTypes.IsAdmin)?.Value, out var isAdmin) && isAdmin;
}