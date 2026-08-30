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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBlogById(Guid id)
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
    public async Task<IActionResult> CreateBlog([FromBody] CreateBlogDto dto)
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

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateBlog([FromRoute] Guid id, [FromBody] UpdateBlogDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateBlog(id={Id}, dto={Dto})", id, JsonSerializer.Serialize(dto));
            if (dto is null)
            {
                return BadRequest(new { Success = false, Message = "Request body cannot be null." });
            }

            var blog = await _blogService.UpdateBlogAsync(id, dto);
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
            _logger.LogError(ex, "Unexpected error occurred in UpdateBlog");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteBlog([FromRoute] Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteBlog(id={Id})", id);
            var deleted = await _blogService.DeleteBlogAsync(id);
            if (!deleted)
            {
                return NotFound(new { Success = false, Message = "Blog not found." });
            }

            return Ok(new { Success = true });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in DeleteBlog");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
