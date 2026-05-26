using Microsoft.AspNetCore.Mvc;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
    private readonly IChallengeService _challengeService;

    public ChallengesController(IChallengeService challengeService)
    {
        _challengeService = challengeService;
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentChallenges()
    {
        var challenges = await _challengeService.GetCurrentChallengesAsync();
        return Ok(new { Success = true, Data = challenges });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChallengeById(int id)
    {
        var challenge = await _challengeService.GetChallengeByIdAsync(id);
        if (challenge is null)
        {
            return NotFound(new { Success = false, Message = "Challenge not found." });
        }

        return Ok(new { Success = true, Data = challenge });
    }
}
