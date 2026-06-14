using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Services;
using BikerHub.Exceptions;
using System.Net;
using System.IdentityModel.Tokens.Jwt;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SocialController : ControllerBase
{
    private readonly ISocialService _socialService;
    private readonly ILogger _logger;

    public SocialController(ISocialService socialService, ILogger<SocialController> logger)
    {
        _socialService = socialService;
        _logger = logger;
    }

    [Authorize]
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogInformation("CALLED GetPosts()");
            _logger.LogDebug("GetPosts called with page {Page} and pageSize {PageSize}", page, pageSize);
            var result = await _socialService.GetPostsAsync(page, pageSize, GetCurrentUserId());
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetPosts");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPosts");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpPatch("posts/{postId:guid}/love")]
    public async Task<IActionResult> TogglePostLove([FromRoute] Guid postId)
    {
        try
        {
            _logger.LogInformation("CALLED TogglePostLove()");
            _logger.LogDebug("TogglePostLove called with postId {PostId}", postId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.TogglePostLoveAsync(postId, currentUserId.Value);
            if (result is null)
            {
                return NotFound(new { Success = false, Message = "Post not found." });
            }

            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in TogglePostLove");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in TogglePostLove");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("posts/{postId:guid}/comments")]
    public async Task<IActionResult> GetPostComments([FromRoute] Guid postId)
    {
        try
        {
            _logger.LogInformation("CALLED GetPostComments()");
            _logger.LogDebug("GetPostComments called with postId {PostId}", postId);
            var comments = await _socialService.GetCommentsForPostAsync(postId);
            return Ok(new { Success = true, Data = comments });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetPostComments");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPostComments");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpPost("posts/{postId:guid}/comments")]
    public async Task<IActionResult> CreatePostComment([FromRoute] Guid postId, [FromBody] CreatePostCommentDto createPostCommentDto)
    {
        try
        {
            _logger.LogInformation("CALLED CreatePostComment()");
            _logger.LogDebug("CreatePostComment called with postId {PostId} and parentCommentId {ParentCommentId}", postId, createPostCommentDto.ParentCommentId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            if (createPostCommentDto.PostId != postId)
            {
                return BadRequest(new { Success = false, Message = "Post ID mismatch." });
            }

            var comment = await _socialService.CreatePostCommentAsync(currentUserId.Value, createPostCommentDto);
            return Ok(new { Success = true, Data = comment });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in CreatePostComment");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in CreatePostComment");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("posts")]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto createPostDto)
    {
        try
        {
            _logger.LogInformation("CALLED CreatePost()");
            _logger.LogDebug("CreatePost called with content {Content}", createPostDto.Content);
            if (string.IsNullOrWhiteSpace(createPostDto.Content) && (createPostDto.ImageUrls == null || !createPostDto.ImageUrls.Any()))
            {
                return BadRequest(new { Success = false, Message = "Post content or images are required." });
            }

            var postDto = await _socialService.CreatePostAsync(createPostDto);
            return Ok(new { Success = true, Data = postDto });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in CreatePost");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in CreatePost");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("posts/by-creator")]
    public async Task<IActionResult> GetPostsByCreator([FromQuery] Guid createdById, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogInformation("CALLED GetPostsByCreator()");
            _logger.LogDebug("GetPostsByCreator called with userId {UserId}, page {Page}, and pageSize {PageSize}", createdById, page, pageSize);
            var result = await _socialService.GetPostsByCreatorAsync(createdById, page, pageSize, GetCurrentUserId());
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetPostsByCreator");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPostsByCreator");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("profiles/{id}")]
    public async Task<IActionResult> GetProfileById(int id)
    {
        try
        {
            _logger.LogInformation("CALLED GetProfileById()");
            _logger.LogDebug("GetProfileById called with id {Id}", id);
            var profile = await _socialService.GetProfileByIdAsync(id);
            if (profile is null)
            {
                return NotFound(new { Success = false, Message = "Social profile not found." });
            }

            return Ok(new { Success = true, Data = profile });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetProfileById");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetProfileById");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(userId, out var parsed) ? parsed : null;
    }
}
