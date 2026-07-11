using Microsoft.AspNetCore.Mvc;
using BikerHub.Services;
using BikerHub.Exceptions;
using System.Net;

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

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentChallenges()
    {
        try
        {
            _logger.LogDebug("CALLED: GetCurrentChallenges()");
            var challenges = await _challengeService.GetCurrentChallengesAsync();
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChallengeById(int id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetChallengeById(id={Id})", id);
            var challenge = await _challengeService.GetChallengeByIdAsync(id);
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
}
