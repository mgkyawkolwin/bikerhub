using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogsController : ControllerBase
{
    private readonly IBlogService _blogService;

    public BlogsController(IBlogService blogService)
    {
        _blogService = blogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBlogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _blogService.GetBlogsAsync(page, pageSize);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBlogById(int id)
    {
        var blog = await _blogService.GetBlogByIdAsync(id);
        if (blog is null)
        {
            return NotFound(new { Success = false, Message = "Blog not found." });
        }

        return Ok(new { Success = true, Data = blog });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBlog(CreateBlogDto dto)
    {
        var blog = await _blogService.CreateBlogAsync(dto);
        return Ok(new { Success = true, Data = blog });
    }
}
