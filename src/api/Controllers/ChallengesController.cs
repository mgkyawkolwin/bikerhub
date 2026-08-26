using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using BikerHub.Api.Dtos;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;

namespace BikerHub.Api.Controllers;


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
            var challenges = await _challengeService.GetChallengesByPeriodAsync(ChallengePeriod.Past);
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
            var challenges = await _challengeService.GetChallengesByPeriodAsync(ChallengePeriod.Current);
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
            var challenges = await _challengeService.GetChallengesByPeriodAsync(ChallengePeriod.Future);
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
            var challenge = await _challengeService.GetChallengeByIdAsync(id);
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
    [HttpPost]
    public async Task<IActionResult> CreateChallenge([FromForm] CreateChallengeDto dto, [FromForm] IFormFile? coverPhoto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateChallenge(title={Title})", dto.Title);
            var challenge = await _challengeService.CreateAsync(dto, coverPhoto);
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
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateChallenge(Guid id, [FromForm] UpdateChallengeDto dto, [FromForm] IFormFile? coverPhoto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateChallenge(id={Id})", id);
            var challenge = await _challengeService.UpdateAsync(id, dto, coverPhoto);
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
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteChallenge(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteChallenge(id={Id})", id);
            var deleted = await _challengeService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { Success = false, Message = "Challenge not found." });
            }

            return Ok(new { Success = true, Message = "Challenge deleted successfully." });
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
            if (challengeId == Guid.Empty)
            {
                return BadRequest(new { Success = false, Message = "A valid challenge id is required." });
            }

            var joined = await _challengeService.JoinChallengeAsync(challengeId);
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
            if (challengeId == Guid.Empty)
            {
                return BadRequest(new { Success = false, Message = "A valid challenge id is required." });
            }

            var left = await _challengeService.LeaveChallengeAsync(challengeId);
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
