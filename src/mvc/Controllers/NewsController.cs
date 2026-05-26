using Microsoft.AspNetCore.Mvc;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;

    public NewsController(INewsService newsService)
    {
        _newsService = newsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _newsService.GetNewsAsync(page, pageSize);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNewsById(int id)
    {
        var news = await _newsService.GetNewsByIdAsync(id);
        if (news is null)
        {
            return NotFound(new { Success = false, Message = "News item not found." });
        }

        return Ok(new { Success = true, Data = news });
    }
}
