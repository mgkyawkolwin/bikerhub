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
    public async Task<IActionResult> GetPosts([FromQuery] SocialPostsFilterDto filterDto)
    {
        try
        {
            _logger.LogInformation("CALLED GetPosts()");
            _logger.LogDebug("GetPosts called with page {Page} and pageSize {PageSize}", filterDto.Page, filterDto.PageSize);
            PaginatedResultDto<SocialPostDto> result;
            if (filterDto.List == Constants.PostListTypes.Feed)
            {
                result = await _socialService.GetFeedsAsync(filterDto);
                return Ok(new { Success = true, Data = result });
            }
            else
            {
                result = await _socialService.GetPostsAsync(filterDto);
                return Ok(new { Success = true, Data = result });
            }
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

    [Authorize]
    [HttpDelete("posts/{postId:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeletePostComment([FromRoute] Guid postId, [FromRoute] Guid commentId)
    {
        try
        {
            _logger.LogInformation("CALLED DeletePostComment()");
            _logger.LogDebug("DeletePostComment called with postId {PostId} and commentId {CommentId}", postId, commentId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var deletedCount = await _socialService.DeletePostCommentAsync(currentUserId.Value, postId, commentId);
            return Ok(new { Success = true, Data = deletedCount });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in DeletePostComment");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in DeletePostComment");
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

    [Authorize]
    [HttpGet("posts/{postId:guid}")]
    public async Task<IActionResult> GetPostById([FromRoute] Guid postId)
    {
        try
        {
            _logger.LogInformation("CALLED GetPostById()");
            _logger.LogDebug("GetPostById called with postId {PostId}", postId);
            var currentUserId = GetCurrentUserId();
            var post = await _socialService.GetPostByIdAsync(postId, currentUserId);
            if (post is null)
            {
                return NotFound(new { Success = false, Message = "Post not found." });
            }
            return Ok(new { Success = true, Data = post });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetPostById");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPostById");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    // [HttpGet("posts/by-creator")]
    // public async Task<IActionResult> GetPostsByUserr([FromQuery] Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    // {
    //     try
    //     {
    //         _logger.LogInformation("CALLED GetPostsByCreator()");
    //         _logger.LogDebug("GetPostsByCreator called with userId {UserId}, page {Page}, and pageSize {PageSize}", userId, page, pageSize);
    //         var result = await _socialService.GetPostsByCreatorAsync(userId, page, pageSize, GetCurrentUserId());
    //         return Ok(new { Success = true, Data = result });
    //     }
    //     catch (CustomException ex)
    //     {
    //         _logger.LogWarning(ex, "Custom exception occurred in GetPostsByCreator");
    //         return BadRequest(new { Success = false, Message = ex.Message });
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Unexpected error occurred in GetPostsByCreator");
    //         return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
    //     }
    // }

    [HttpGet("profiles/{userId}")]
    public async Task<IActionResult> GetProfileByIdAsync([FromRoute] Guid userId)
    {
        try
        {
            _logger.LogInformation("CALLED GetProfileById()");
            _logger.LogDebug("GetProfileById called with id {Id}", userId);
            var profile = await _socialService.GetProfileByIdAsync(userId);
            if (profile is null)
            {
                return NotFound(new { Success = false, Message = "Social profile not found." });
            }
            _logger.LogTrace("Profile returned: {@Profile}", new { Success = true, Data = profile });
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

    [HttpGet("profiles/search")]
    public async Task<IActionResult> SearchProfilesAsync([FromQuery] string query)
    {
        try
        {
            _logger.LogInformation("CALLED SearchProfilesAsync()");
            _logger.LogDebug("SearchProfilesAsync called with query {Query}", query);
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(new { Success = true, Data = Array.Empty<SocialProfileDto>() });
            }

            var profiles = await _socialService.SearchProfilesAsync(query.Trim());
            _logger.LogTrace("Search results count: {Count}", profiles?.Count() ?? 0);
            return Ok(new { Success = true, Data = profiles });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in SearchProfiles");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in SearchProfiles");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpPost("follow/{followingId:guid}")]
    public async Task<IActionResult> FollowUser([FromRoute] Guid followingId)
    {
        try
        {
            _logger.LogInformation("CALLED FollowUser()");
            _logger.LogDebug("FollowUser called with followingId {FollowingId}", followingId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.FollowUserAsync(currentUserId.Value, followingId);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in FollowUser");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in FollowUser");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpDelete("follow/{followingId:guid}")]
    public async Task<IActionResult> UnfollowUser([FromRoute] Guid followingId)
    {
        try
        {
            _logger.LogInformation("CALLED UnfollowUser()");
            _logger.LogDebug("UnfollowUser called with followingId {FollowingId}", followingId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.UnfollowUserAsync(currentUserId.Value, followingId);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in UnfollowUser");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in UnfollowUser");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpGet("follow/{followingId:guid}/is-following")]
    public async Task<IActionResult> IsFollowing([FromRoute] Guid followingId)
    {
        try
        {
            _logger.LogInformation("CALLED IsFollowing()");
            _logger.LogDebug("IsFollowing called with followingId {FollowingId}", followingId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var isFollowing = await _socialService.IsFollowingAsync(currentUserId.Value, followingId);
            return Ok(new { Success = true, Data = new { IsFollowing = isFollowing } });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in IsFollowing");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in IsFollowing");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("followers/{userId:guid}")]
    public async Task<IActionResult> GetFollowers([FromRoute] Guid userId)
    {
        try
        {
            _logger.LogInformation("CALLED GetFollowers()");
            _logger.LogDebug("GetFollowers called with userId {UserId}", userId);
            var followers = await _socialService.GetFollowersAsync(userId);
            return Ok(new { Success = true, Data = followers });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetFollowers");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetFollowers");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("following/{userId:guid}")]
    public async Task<IActionResult> GetFollowing([FromRoute] Guid userId)
    {
        try
        {
            _logger.LogInformation("CALLED GetFollowing()");
            _logger.LogDebug("GetFollowing called with userId {UserId}", userId);
            var following = await _socialService.GetFollowingAsync(userId);
            return Ok(new { Success = true, Data = following });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetFollowing");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetFollowing");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpPost("friend-requests")]
    public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestDto sendFriendRequestDto)
    {
        try
        {
            _logger.LogInformation("CALLED SendFriendRequest()");
            _logger.LogDebug("SendFriendRequest called with toProfileId {ToProfileId}", sendFriendRequestDto.ToProfileId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.SendFriendRequestAsync(currentUserId.Value, sendFriendRequestDto.ToProfileId);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in SendFriendRequest");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in SendFriendRequest");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpPatch("friend-requests/{requestId:guid}/approve")]
    public async Task<IActionResult> ApproveFriendRequest([FromRoute] Guid requestId)
    {
        try
        {
            _logger.LogInformation("CALLED ApproveFriendRequest()");
            _logger.LogDebug("ApproveFriendRequest called with requestId {RequestId}", requestId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.ApproveFriendRequestAsync(requestId, currentUserId.Value);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in ApproveFriendRequest");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in ApproveFriendRequest");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpPatch("friend-requests/{requestId:guid}/reject")]
    public async Task<IActionResult> RejectFriendRequest([FromRoute] Guid requestId)
    {
        try
        {
            _logger.LogInformation("CALLED RejectFriendRequest()");
            _logger.LogDebug("RejectFriendRequest called with requestId {RequestId}", requestId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.RejectFriendRequestAsync(requestId, currentUserId.Value);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in RejectFriendRequest");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in RejectFriendRequest");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpGet("friend-requests/pending")]
    public async Task<IActionResult> GetPendingFriendRequests()
    {
        try
        {
            _logger.LogInformation("CALLED GetPendingFriendRequests()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var requests = await _socialService.GetPendingFriendRequestsAsync(currentUserId.Value);
            return Ok(new { Success = true, Data = requests });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in GetPendingFriendRequests");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPendingFriendRequests");
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
