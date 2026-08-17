using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Services;
using BikerHub.Api.Exceptions;
using System.Net;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : BaseController
{
    private readonly INewsService _newsService;
    private readonly ILogger<NewsController> _logger;

    public NewsController(INewsService newsService, ILogger<NewsController> logger) : base(logger)
    {
        _newsService = newsService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetNews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetNews(page={Page}, pageSize={PageSize})", page, pageSize);
            var result = await _newsService.GetNewsAsync(page, pageSize);
            return Ok(new { Success = true, Data = result });
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
    public async Task<IActionResult> GetNewsById(int id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetNewsById({NewsId})", id);
            var news = await _newsService.GetNewsByIdAsync(id);
            if (news is null)
            {
                return NotFound(new { Success = false, Message = "News item not found." });
            }

            return Ok(new { Success = true, Data = news });
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
