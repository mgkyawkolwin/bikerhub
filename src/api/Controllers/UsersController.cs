using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Services;
using BikerHub.Exceptions;
using System.Net;

namespace BikerHub.Controllers;

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

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
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
                    UserName = user.UserName,
                    Email = user.Email,
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
