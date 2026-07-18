using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using BikerHub.Exceptions;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
    private readonly IChallengeService _challengeService;
    private readonly ILogger<ChallengesController> _logger;

    public ChallengesController(IChallengeService challengeService, ILogger<ChallengesController> logger)
    {
        _challengeService = challengeService;
        _logger = logger;
    }

    [HttpGet("past")]
    public async Task<IActionResult> GetPastChallenges()
    {
        try
        {
            _logger.LogDebug("CALLED: GetPastChallenges()");
            var currentUserId = GetCurrentUserId();
            var challenges = await _challengeService.GetChallengesByPeriodAsync(ChallengePeriod.Past, currentUserId);
            return Ok(new { Success = true, Data = challenges });
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

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentChallenges()
    {
        try
        {
            _logger.LogDebug("CALLED: GetCurrentChallenges()");
            var currentUserId = GetCurrentUserId();
            var challenges = await _challengeService.GetChallengesByPeriodAsync(ChallengePeriod.Current, currentUserId);
            return Ok(new { Success = true, Data = challenges });
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

    [HttpGet("future")]
    public async Task<IActionResult> GetFutureChallenges()
    {
        try
        {
            _logger.LogDebug("CALLED: GetFutureChallenges()");
            var currentUserId = GetCurrentUserId();
            var challenges = await _challengeService.GetChallengesByPeriodAsync(ChallengePeriod.Future, currentUserId);
            return Ok(new { Success = true, Data = challenges });
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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetChallengeById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetChallengeById(id={Id})", id);
            var currentUserId = GetCurrentUserId();
            var challenge = await _challengeService.GetChallengeByIdAsync(id, currentUserId);
            if (challenge is null)
            {
                return NotFound(new { Success = false, Message = "Challenge not found." });
            }

            return Ok(new { Success = true, Data = challenge });
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

    [Authorize]
    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> JoinChallenge(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: JoinChallenge(id={Id})", id);
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null)
            {
                return Unauthorized(new { Success = false, Message = "User is not authenticated." });
            }

            var joined = await _challengeService.JoinChallengeAsync(id, currentUserId.Value);
            if (!joined)
            {
                return NotFound(new { Success = false, Message = "Challenge not found." });
            }

            return Ok(new { Success = true, Message = "Challenge joined successfully." });
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

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
