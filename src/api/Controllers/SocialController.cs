using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
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
public class SocialController : BaseController
{
    private readonly ISocialService _socialService;
    private readonly ILogger<SocialController> _logger;

    public SocialController(ISocialService socialService, ILogger<SocialController> logger): base(logger)
    {
        _socialService = socialService;
        _logger = logger;
    }

    [Authorize]
    [HttpPost("posts/{postId:guid}/media")]
    public async Task<IActionResult> UploadPostMedia([FromRoute] Guid postId, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogInformation("CALLED UploadPostMedia()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
                return Unauthorized(new { Success = false, Message = "Authentication required." });

            var dto = await _socialService.UploadPostMediaAsync(postId, file);
            return Ok(new { Success = true, Data = dto });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("posts/{postId:guid}/media")]
    public async Task<IActionResult> GetPostMedia([FromRoute] Guid postId)
    {
        try
        {
            _logger.LogInformation("CALLED GetPostMedia()");
            var results = await _socialService.GetPostMediaAsync(postId);
            if (!results.Any())
            {
                return NotFound(new { Success = false, Message = "Post not found or has no media." });
            }
            return Ok(new { Success = true, Data = results });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] SocialPostsFilterDto filterDto)
    {
        try
        {
            _logger.LogInformation("CALLED GetPosts()");
            _logger.LogDebug("GetPosts called with page {@dto}", filterDto);
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogDebug("CreatePostComment called with postId {PostId} and parentCommentId {@createPostCommentDto}", postId, createPostCommentDto);
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("posts")]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto createPostDto)
    {
        try
        {
            _logger.LogInformation("CALLED CreatePost()");
            _logger.LogDebug("CreatePost called with content {@Content}", createPostDto);

            var postDto = await _socialService.CreatePostAsync(createPostDto);
            return Ok(new { Success = true, Data = postDto });
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

    [Authorize]
    [HttpDelete("posts/{postId:guid}")]
    public async Task<IActionResult> DeletePost([FromRoute] Guid postId)
    {
        try
        {
            _logger.LogInformation("CALLED DeletePost()");
            _logger.LogDebug("DeletePost called with postId {PostId}", postId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            await _socialService.DeletePostAsync(currentUserId.Value, postId);
            return Ok(new { Success = true });
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

    [Authorize]
    [HttpDelete("posts/{postId:guid}/media/{mediaId:guid}")]
    public async Task<IActionResult> DeletePostMedia([FromRoute] Guid postId, [FromRoute] Guid mediaId)
    {
        try
        {
            _logger.LogInformation("CALLED DeletePostMedia()");
            _logger.LogDebug("DeletePostMedia called with postId {PostId} and mediaId {MediaId}", postId, mediaId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            await _socialService.DeletePostMediaAsync(currentUserId.Value, postId, mediaId);
            return Ok(new { Success = true });
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            var currentUserId = GetCurrentUserId();
            if(!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }
            var profile = await _socialService.GetProfileByIdAsync(userId, currentUserId.Value);
            if (profile is null)
            {
                return NotFound(new { Success = false, Message = "Social profile not found." });
            }
            _logger.LogTrace("Profile returned: {@Profile}", new { Success = true, Data = profile });
            return Ok(new { Success = true, Data = profile });
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

    [Authorize]
    [HttpPatch("profiles/social-links")]
    public async Task<IActionResult> UpdateSocialLinks([FromBody] UpdateSocialLinksDto updateSocialLinksDto)
    {
        try
        {
            _logger.LogInformation("CALLED UpdateSocialLinks()");
            _logger.LogDebug("UpdateSocialLinks called with payload {@Payload}", updateSocialLinksDto);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.UpdateSocialLinksAsync(currentUserId.Value, updateSocialLinksDto.SocialLinks ?? Enumerable.Empty<SocialLinkDto>());
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

    [Authorize]
    [HttpPost("profiles/cover-photo")]
    public async Task<IActionResult> UploadProfileCoverPhoto([FromForm] IFormFile file)
    {
        try
        {
            _logger.LogInformation("CALLED UploadProfileCoverPhoto()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
                return Unauthorized(new { Success = false, Message = "Authentication required." });

            if (file is null)
                return BadRequest(new { Success = false, Message = "A cover photo file is required." });

            var result = await _socialService.UploadProfileCoverPhotoAsync(currentUserId.Value, file);
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

    [Authorize]
    [HttpPost("profiles/profile-photo")]
    public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile file)
    {
        try
        {
            _logger.LogInformation("CALLED UploadProfilePhoto()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
                return Unauthorized(new { Success = false, Message = "Authentication required." });

            if (file is null)
                return BadRequest(new { Success = false, Message = "A profile photo file is required." });

            var result = await _socialService.UploadProfilePhotoAsync(currentUserId.Value, file);
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

    [Authorize]
    [HttpDelete("profiles/cover-photo")]
    public async Task<IActionResult> DeleteProfileCoverPhoto()
    {
        try
        {
            _logger.LogInformation("CALLED DeleteProfileCoverPhoto()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
                return Unauthorized(new { Success = false, Message = "Authentication required." });

            var result = await _socialService.DeleteProfileCoverPhotoAsync(currentUserId.Value);
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

    [Authorize]
    [HttpDelete("profiles/profile-photo")]
    public async Task<IActionResult> DeleteProfilePhoto()
    {
        try
        {
            _logger.LogInformation("CALLED DeleteProfilePhoto()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
                return Unauthorized(new { Success = false, Message = "Authentication required." });

            var result = await _socialService.DeleteProfilePhotoAsync(currentUserId.Value);
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [Authorize]
    [HttpGet("friends")]
    public async Task<IActionResult> GetFriends()
    {
        try
        {
            _logger.LogInformation("CALLED GetFriends()");
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var friends = await _socialService.GetFriendsAsync(currentUserId.Value);
            return Ok(new { Success = true, Data = friends });
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

    [Authorize]
    [HttpDelete("friends/{userId:guid}")]
    public async Task<IActionResult> RemoveFriend([FromRoute] Guid userId)
    {
        try
        {
            _logger.LogInformation("CALLED RemoveFriend()");
            _logger.LogDebug("RemoveFriend called with userId {UserId}", userId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.RemoveFriendAsync(currentUserId.Value, userId);
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

    [Authorize]
    [HttpPost("friend-requests")]
    public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestDto sendFriendRequestDto)
    {
        try
        {
            _logger.LogInformation("CALLED SendFriendRequest()");
            _logger.LogDebug("SendFriendRequest called with: {@dto}", sendFriendRequestDto);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.AddFriendRequestAsync(currentUserId.Value, sendFriendRequestDto.ToProfileId);
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

    [Authorize]
    [HttpDelete("friend-requests/{toProfileId:guid}")]
    public async Task<IActionResult> CancelFriendRequest([FromRoute] Guid toProfileId)
    {
        try
        {
            _logger.LogInformation("CALLED CancelFriendRequest()");
            _logger.LogDebug("CancelFriendRequest called with toProfileId {ToProfileId}", toProfileId);
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new { Success = false, Message = "Authentication required." });
            }

            var result = await _socialService.CancelFriendRequestAsync(currentUserId.Value, toProfileId);
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
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
