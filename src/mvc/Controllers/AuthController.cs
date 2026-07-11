using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos.Auth;
using BikerHub.Services;
using System.Net;
using System.Text.Json;
using BikerHub.Exceptions;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: Register(dto={Dto})", JsonSerializer.Serialize(dto));
            _logger.LogDebug("Register DTO: {Dto}", JsonSerializer.Serialize(dto));

            var response = await _authService.RegisterAsync(dto);

            return Ok(new {Success = true, Data = response});
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Registration failed for user {Name}", dto.UserName);
            return StatusCode((int)HttpStatusCode.BadRequest, new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while registering user");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while registering the user." });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: Login(dto={Dto})", JsonSerializer.Serialize(dto));

            var response = await _authService.SignInAsync(dto);

            _logger.LogDebug("Login successful for username {Username}", dto.Username);
            _logger.LogDebug("AuthResponseDto: {Response}", JsonSerializer.Serialize(response));

            return Ok(new {Success = true, Data = response});
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Login failed for username {Username}", dto.Username);
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while signing in");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while signing in." });
        }
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponseDto>> GoogleSignIn(GoogleLoginDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: GoogleSignIn(dto={Dto})", JsonSerializer.Serialize(dto));

            var response = await _authService.SignInWithGoogleAsync(dto);

            _logger.LogDebug("Google sign-in successful for user {Email}", response.User.Email);
            _logger.LogDebug("AuthResponseDto: {Response}", JsonSerializer.Serialize(response));

            return Ok(new { Success = true, Data = response });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Google sign-in failed");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while signing in with Google");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while signing in with Google." });
        }
    }
}
