using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Services;
using BikerHub.Api.Exceptions;
using System.Net;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogsController : ControllerBase
{
    private readonly IBlogService _blogService;
    private readonly ILogger<BlogsController> _logger;

    public BlogsController(IBlogService blogService, ILogger<BlogsController> logger)
    {
        _blogService = blogService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetBlogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetBlogs(page={Page}, pageSize={PageSize})", page, pageSize);
            var result = await _blogService.GetBlogsAsync(page, pageSize);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetBlogs");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBlogById(int id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetBlogById(id={Id})", id);
            var blog = await _blogService.GetBlogByIdAsync(id);
            if (blog is null)
            {
                return NotFound(new { Success = false, Message = "Blog not found." });
            }

            return Ok(new { Success = true, Data = blog });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetBlogById");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBlog(CreateBlogDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateBlog(dto={Dto})", JsonSerializer.Serialize(dto));
            var blog = await _blogService.CreateBlogAsync(dto);
            return Ok(new { Success = true, Data = blog });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in CreateBlog");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
