using Microsoft.AspNetCore.Mvc;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SocialController : ControllerBase
{
    private readonly ISocialService _socialService;

    public SocialController(ISocialService socialService)
    {
        _socialService = socialService;
    }

    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _socialService.GetPostsAsync(page, pageSize);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("posts/by-author")]
    public async Task<IActionResult> GetPostsByAuthor([FromQuery] string authorId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _socialService.GetPostsByAuthorAsync(authorId, page, pageSize);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("profiles/{id}")]
    public async Task<IActionResult> GetProfileById(int id)
    {
        var profile = await _socialService.GetProfileByIdAsync(id);
        if (profile is null)
        {
            return NotFound(new { Success = false, Message = "Social profile not found." });
        }

        return Ok(new { Success = true, Data = profile });
    }
}
