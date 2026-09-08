using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Services;
using BikerHub.Api.Exceptions;
using System.Net;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UsersController : BaseController
{
    private readonly AppDbContext _dbContext;
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;
    public UsersController(AppDbContext dbContext, IUserService userService, ILogger<UsersController> logger) : base(logger)
    {
        _dbContext = dbContext;
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            _logger.LogDebug("CALLED: GetMe()");
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Success = false, Message = "Invalid token claims." });
            }

            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { Success = false, Message = "User not found." });
            }

            return Ok(new
            {
                Success = true,
                Data = new UserDto
                {
                    Id = user.Id,
                    DisplayName = user.DisplayName,
                    UserName = user.UserName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Address = user.Address,
                    City = user.City,
                    Rating = user.Rating,
                    RatingCount = user.RatingCount,
                    ProfilePictureUrl = user.ProfilePictureUrl,
                    Token = null
                }
            });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: ChangePassword()");
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Success = false, Message = "Invalid token claims." });
            }

            await _userService.ChangePasswordAsync(userId, dto.CurrentPassword ?? string.Empty, dto.NewPassword ?? string.Empty);
            return Ok(new { Success = true, Message = "Password updated." });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateUserDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateMe()");
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Success = false, Message = "Invalid token claims." });
            }

            var updated = await _userService.UpdateAsync(userId, dto);
            if (updated == null)
            {
                return NotFound(new { Success = false, Message = "User not found." });
            }

            return Ok(new { Success = true, Data = updated });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    // [HttpGet("me/favorites")]
    // public async Task<IActionResult> GetFavoriteListings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    // {
    //     try
    //     {
    //         _logger.LogDebug("CALLED: GetFavoriteListings()");
    //         var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
    //         ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    //         // if (string.IsNullOrEmpty(userIdClaim) || !string.TryParse(userIdClaim, out var userId))
    //         // {
    //         //     return Unauthorized(new { Success = false, Message = "Invalid token claims." });
    //         // }

    //         var result = await _userService.GetFavoriteListingsAsync(page, pageSize, userIdClaim);
    //         return Ok(new { Success = true, Data = result });
    //     }
    //     catch (CustomException ex)
    //     {
    //         _logger.LogError("Custom exception occurred: {Message}", ex.Message);
    //         return Ok(new { Success = false, Message = ex.Message });
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Unexpected error occurred.");
    //         return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
    //     }
    // }
}
