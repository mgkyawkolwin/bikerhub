using BikerHub.Api.Dtos.Auth;

namespace BikerHub.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> SignInAsync(LoginDto dto);
    Task<AuthResponseDto> SignInAdminAsync(LoginDto dto);
    Task<AuthResponseDto> SignInWithGoogleAsync(GoogleLoginDto dto);
}
