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
public class ChallengesController : BaseController
{
    private readonly IChallengeService _challengeService;
    private readonly ILogger<ChallengesController> _logger;

    public ChallengesController(IChallengeService challengeService, ILogger<ChallengesController> logger) : base(logger)
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
            _logger.LogTrace("Current user id: {CurrentUserId}", currentUserId);
            var challenge = await _challengeService.GetChallengeByIdAsync(id, currentUserId);
            _logger.LogTrace("Challenge returned for id {Id}: {Challenge}", id, challenge is null ? "null" : System.Text.Json.JsonSerializer.Serialize(challenge));
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
    [HttpGet("{challengeId:guid}/join")]
    public async Task<IActionResult> JoinChallenge([FromRoute] Guid challengeId)
    {
        try
        {
            _logger.LogDebug("CALLED: JoinChallenge(challengeId={ChallengeId})", challengeId);
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null)
            {
                return Unauthorized(new { Success = false, Message = "User is not authenticated." });
            }

            if (challengeId == Guid.Empty)
            {
                return BadRequest(new { Success = false, Message = "A valid challenge id is required." });
            }

            var joined = await _challengeService.JoinChallengeAsync(challengeId, currentUserId.Value);
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

    [Authorize]
    [HttpGet("{challengeId:guid}/leave")]
    public async Task<IActionResult> LeaveChallenge([FromRoute] Guid challengeId)
    {
        try
        {
            _logger.LogDebug("CALLED: LeaveChallenge(challengeId={ChallengeId})", challengeId);
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null)
            {
                return Unauthorized(new { Success = false, Message = "User is not authenticated." });
            }

            if (challengeId == Guid.Empty)
            {
                return BadRequest(new { Success = false, Message = "A valid challenge id is required." });
            }

            var left = await _challengeService.LeaveChallengeAsync(challengeId, currentUserId.Value);
            if (!left)
            {
                return NotFound(new { Success = false, Message = "Challenge not found." });
            }

            return Ok(new { Success = true, Message = "Challenge left successfully." });
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
}
