using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IUserService _userService;

    public UserController(AppDbContext dbContext, IUserService userService)
    {
        _dbContext = dbContext;
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
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
                Name = user.Name,
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

    [HttpGet("me/favorites")]
    public async Task<IActionResult> GetFavoriteListings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? string.Empty;
        var result = await _userService.GetFavoriteListingsAsync(page, pageSize, userId);
        return Ok(new { Success = true, Data = result });
    }
}
