using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Utilities;
using System.Text.Json.Serialization;

namespace BikerHub.Api.Services;

public interface ISocialService
{
    Task<PaginatedResultDto<SocialPostDto>> GetFeedsAsync(SocialPostsFilterDto filterDto);
    Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(SocialPostsFilterDto filterDto);
    Task<SocialPostDto?> GetPostByIdAsync(Guid postId);
    Task DeletePostAsync(Guid postId);
    Task DeletePostMediaAsync(Guid postId, Guid mediaId);
    Task<SocialPostDto> CreatePostAsync(CreatePostDto createPostDto);
    Task<SocialPostMediaDto> UploadPostMediaAsync(Guid postId, IFormFile file);
    Task<SocialProfileDto> UploadProfileCoverPhotoAsync(IFormFile file);
    Task<SocialProfileDto> UploadProfilePhotoAsync(IFormFile file);
    Task<SocialProfileDto> DeleteProfileCoverPhotoAsync();
    Task<SocialProfileDto> DeleteProfilePhotoAsync();
    Task<IEnumerable<SocialPostMediaDto>> GetPostMediaAsync(Guid postId);
    Task<SocialProfileDto?> GetProfileByIdAsync(Guid userId);
    Task<SocialProfileDto> UpdateSocialLinksAsync(IEnumerable<SocialLinkDto> socialLinks);
    Task<IEnumerable<SocialProfileDto>> SearchProfilesAsync(string query);
    Task<SocialPostDto?> TogglePostLoveAsync(Guid postId);
    Task<IEnumerable<SocialPostCommentDto>> GetCommentsForPostAsync(Guid postId);
    Task<SocialPostCommentDto> CreatePostCommentAsync(CreatePostCommentDto createPostCommentDto);
    Task<int> DeletePostCommentAsync(Guid postId, Guid commentId);
    Task<SocialProfileDto> FollowUserAsync(Guid userId);
    Task<SocialProfileDto> UnfollowUserAsync(Guid userId);
    Task<bool> IsFollowingAsync(Guid userId);
    Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId);
    Task<IEnumerable<FollowerDto>> GetFriendsAsync(Guid userId);
    Task<IEnumerable<FollowingDto>> GetFollowingAsync(Guid userId);
    Task<SocialProfileDto> AddFriendRequestAsync(Guid userId);
    Task<SocialProfileDto> ApproveFriendRequestAsync(Guid requestId);
    Task<SocialProfileDto> RejectFriendRequestAsync(Guid requestId);
    Task<SocialProfileDto> CancelFriendRequestAsync(Guid userId);
    Task<SocialProfileDto> RemoveFriendAsync(Guid friendUserId);
    Task<IEnumerable<PendingFriendRequestDto>> GetPendingFriendRequestsAsync();
}

public class SocialService : ISocialService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<SocialService> _logger;
    private readonly IStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;

    public SocialService(AppDbContext dbContext, ILogger<SocialService> logger, IStorageService storageService, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _storageService = storageService;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetFeedsAsync(SocialPostsFilterDto filterDto)
    {
        _logger.LogInformation("CALLED GetFeedsAsync()");
        _logger.LogDebug("GetFeedsAsync called with page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", filterDto.Page, filterDto.PageSize, filterDto.UserId);

        Guid currentProfileId = Guid.Empty;
        if (filterDto.UserId.HasValue)
        {
            _logger.LogTrace("Fetching current profile ID for user ID {CurrentUserId}", filterDto.UserId.Value);
            currentProfileId = await _dbContext.SocialProfiles
                .Where(profile => profile.UserId == filterDto.UserId.Value)
                .Select(profile => profile.Id)
                .FirstOrDefaultAsync();
            _logger.LogTrace("Fetched current profile ID: {CurrentProfileId}", currentProfileId);
            if (currentProfileId == Guid.Empty)
            {
                currentProfileId = Guid.Empty;
            }
        }

        var query = _dbContext.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Medias)
            .OrderByDescending(post => post.CreatedAtUtc)
            .Select(post => new
            {
                post,
                currentProfileId,
                profilePhotoUrl = _dbContext.SocialProfiles
                    .Where(profile => profile.UserId == post.UserId)
                    .Select(profile => profile.ProfilePhotoUrl)
                    .FirstOrDefault()
            });

        var total = await query.CountAsync();
        var items = await query.Skip((filterDto.Page - 1) * filterDto.PageSize).Take(filterDto.PageSize).ToListAsync();
        _logger.LogTrace("Fetched {Count} posts from database", items.Count);
        _logger.LogTrace("First post details: {PostDetails}", items.Count > 0
    ? JsonSerializer.Serialize(items[0], new JsonSerializerOptions
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = true
    })
    : "No posts");
        return new PaginatedResultDto<SocialPostDto>(items.Select(item => MapPost(item.post, item.currentProfileId, item.profilePhotoUrl)).ToList(), filterDto.Page, filterDto.PageSize, total, Pagination.GetTotalPages(total, filterDto.PageSize));
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(SocialPostsFilterDto filterDto)
    {
        _logger.LogInformation("CALLED GetPostsAsync()");
        _logger.LogDebug("GetPostsAsync called with page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", filterDto.Page, filterDto.PageSize, filterDto.UserId);

        Guid currentProfileId = Guid.Empty;
        if (filterDto.UserId.HasValue)
        {
            _logger.LogTrace("Fetching current profile ID for user ID {CurrentUserId}", filterDto.UserId.Value);
            currentProfileId = await _dbContext.SocialProfiles
                .Where(profile => profile.UserId == filterDto.UserId.Value)
                .Select(profile => profile.Id)
                .FirstOrDefaultAsync();
            _logger.LogTrace("Fetched current profile ID: {CurrentProfileId}", currentProfileId);
            if (currentProfileId == Guid.Empty)
            {
                currentProfileId = Guid.Empty;
            }
        }

        var query = _dbContext.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Medias)
            .Where(post => post.UserId == filterDto.UserId)
            .OrderByDescending(post => post.CreatedAtUtc)
            .Select(post => new
            {
                post,
                currentProfileId,
                profilePhotoUrl = _dbContext.SocialProfiles
                    .Where(profile => profile.UserId == post.UserId)
                    .Select(profile => profile.ProfilePhotoUrl)
                    .FirstOrDefault()
            });

        var total = await query.CountAsync();
        var items = await query.Skip((filterDto.Page - 1) * filterDto.PageSize).Take(filterDto.PageSize).ToListAsync();
        _logger.LogTrace("Fetched {Count} posts from database", items.Count);
        _logger.LogTrace("First post details: {PostDetails}", items.Count > 0
    ? JsonSerializer.Serialize(items[0], new JsonSerializerOptions
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = true
    })
    : "No posts");
        return new PaginatedResultDto<SocialPostDto>(items.Select(item => MapPost(item.post, item.currentProfileId, item.profilePhotoUrl)).ToList(), filterDto.Page, filterDto.PageSize, total, Pagination.GetTotalPages(total, filterDto.PageSize));
    }

    public async Task<SocialPostDto?> GetPostByIdAsync(Guid postId)
    {
        _logger.LogInformation("CALLED GetPostByIdAsync()");
        _logger.LogDebug("GetPostByIdAsync called with postId {PostId}", postId);

        Guid currentProfileId = await _dbContext.SocialProfiles
                .Where(profile => profile.UserId == Guid.Parse(_currentUserService.UserId!))
                .Select(profile => profile.Id)
                .FirstOrDefaultAsync();

        var post = await _dbContext.Posts
            .Include(p => p.Likes)
            .Include(p => p.User)
            .Where(p => p.Id == postId)
            .Select(p => new
            {
                post = p,
                profilePhotoUrl = _dbContext.SocialProfiles
                    .Where(profile => profile.UserId == p.UserId)
                    .Select(profile => profile.ProfilePhotoUrl)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            return null;
        }

        return MapPost(post.post, currentProfileId, post.profilePhotoUrl);
    }

    public async Task<SocialPostDto> CreatePostAsync(CreatePostDto createPostDto)
    {
        _logger.LogInformation("CALLED CreatePostAsync()");
        _logger.LogDebug("CreatePostAsync called with createdByUserId {CreatedById}", createPostDto.CreatedById);
        var user = await _dbContext.Users.FirstOrDefaultAsync(p => p.Id == createPostDto.CreatedById);
        if (user is null)
        {
            _logger.LogWarning("User not found for ID {CreatedById}", createPostDto.CreatedById);
            throw new Exception("User not found for the given user ID.");
        }
        var postEntity = new SocialPostEntity
        {
            Content = createPostDto.Content,
            UserId = user.Id,
            User = user
        };

        _dbContext.Posts.Add(postEntity);
        await _dbContext.SaveChangesAsync();

        return MapPost(postEntity, Guid.Empty, "");
    }

    public async Task DeletePostAsync(Guid postId)
    {
        _logger.LogInformation("CALLED DeletePostAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("DeletePostAsync called with currentUserId {CurrentUserId} and postId {PostId}", currentUserId, postId);

        var post = await _dbContext.Posts
            .Include(p => p.Medias)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            throw new CustomException("Post not found.");
        }

        if (post.UserId != Guid.Parse(_currentUserService.UserId!))
        {
            _logger.LogWarning("User {UserId} is not authorized to delete post {PostId}", Guid.Parse(_currentUserService.UserId!), postId);
            throw new CustomException("Not authorized to delete this post.");
        }

        if (post.Medias?.Any() == true && _storageService is not null)
        {
            foreach (var media in post.Medias)
            {
                try
                {
                    await _storageService.DeleteObjectAsync(media.ObjectName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete media object {ObjectName} for post {PostId}", media.ObjectName, postId);
                }
            }
        }

        _dbContext.Posts.Remove(post);
        await _dbContext.SaveChangesAsync();
    }

    public async Task DeletePostMediaAsync(Guid postId, Guid mediaId)
    {
        _logger.LogInformation("CALLED DeletePostMediaAsync()");
        _logger.LogDebug("DeletePostMediaAsync called with currentUserId {CurrentUserId}, postId {PostId}, mediaId {MediaId}", Guid.Parse(_currentUserService.UserId!), postId, mediaId);

        var post = await _dbContext.Posts.FirstOrDefaultAsync(p => p.Id == postId);
        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            throw new CustomException("Post not found.");
        }

        if (post.UserId != Guid.Parse(_currentUserService.UserId!))
        {
            _logger.LogWarning("User {UserId} is not authorized to delete media for post {PostId}", Guid.Parse(_currentUserService.UserId!), postId);
            throw new CustomException("Not authorized to delete this media.");
        }

        var media = await _dbContext.PostMedia.FirstOrDefaultAsync(m => m.Id == mediaId && m.PostId == postId);
        if (media is null)
        {
            _logger.LogWarning("Media not found for ID {MediaId} on post {PostId}", mediaId, postId);
            throw new CustomException("Media not found.");
        }

        if (_storageService is not null)
        {
            try
            {
                await _storageService.DeleteObjectAsync(media.ObjectName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete media object {ObjectName} for post {PostId}", media.ObjectName, postId);
            }
        }

        _dbContext.PostMedia.Remove(media);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<SocialPostDto?> TogglePostLoveAsync(Guid postId)
    {
        _logger.LogInformation("CALLED TogglePostLoveAsync()");
        _logger.LogDebug("TogglePostLoveAsync called with postId {PostId} and currentUserId {CurrentUserId}", postId, Guid.Parse(_currentUserService.UserId!));

        var post = await _dbContext.Posts
            .Include(p => p.Likes)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            return null;
        }

        var existingLike = post.Likes.FirstOrDefault(like => like.UserId == Guid.Parse(_currentUserService.UserId!));
        if (existingLike is null)
        {
            _logger.LogInformation("Adding like for post {PostId} by user {UserId}", postId, Guid.Parse(_currentUserService.UserId!));
            post.Likes.Add(new SocialPostLikeEntity
            {
                PostId = postId,
                UserId = Guid.Parse(_currentUserService.UserId!),
                LikedAtUTC = DateTime.UtcNow
            });
            post.LoveCount += 1;
        }
        else
        {
            _logger.LogInformation("Removing like for post {PostId} by user {UserId}", postId, Guid.Parse(_currentUserService.UserId!));
            _dbContext.SocialPostLikes.Remove(existingLike);
            post.Likes.Remove(existingLike);
            post.LoveCount = Math.Max(0, post.LoveCount - 1);
        }

        _dbContext.Posts.Update(post);
        await _dbContext.SaveChangesAsync();

        return MapPost(post, Guid.Parse(_currentUserService.UserId!));
    }

    public async Task<SocialProfileDto?> GetProfileByIdAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetProfileByIdAsync()");
        _logger.LogDebug("GetProfileByIdAsync called with userId {UserId} and currentUserId {CurrentUserId}", userId, Guid.Parse(_currentUserService.UserId!));
        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == userId);
        _logger.LogTrace("Fetched profile: {@profile}", profile);
        if (profile == null)
        {
            _logger.LogWarning("Social profile not found for user ID {UserId}", userId);
            return null;
        }

        var isFriend = false;
        var isFollowing = false;
        var isFriendRequestPending = false;

        isFriend = profile.Friends.Any(friend => friend.Id == Guid.Parse(_currentUserService.UserId!));
        isFollowing = profile.Followers.Any(follower => follower.Id == Guid.Parse(_currentUserService.UserId!));
        isFriendRequestPending = await _dbContext.FriendRequests.AnyAsync(r =>
            r.Status == FriendRequestStatus.Pending &&
            ((r.FromUserId == Guid.Parse(_currentUserService.UserId!) && r.ToUserId == profile.UserId) ||
             (r.FromUserId == profile.UserId && r.ToUserId == Guid.Parse(_currentUserService.UserId!))));

        var profileDto = MapProfile(profile, isFriend, isFriendRequestPending, isFollowing);
        _logger.LogTrace("Mapped profile DTO: {@profileDto}", profileDto);
        return profileDto;
    }

    public async Task<SocialProfileDto> UpdateSocialLinksAsync(IEnumerable<SocialLinkDto> socialLinks)
    {
        _logger.LogInformation("CALLED UpdateSocialLinksAsync()");
        _logger.LogDebug("UpdateSocialLinksAsync called with currentUserId {CurrentUserId} and socialLinks {@SocialLinks}", Guid.Parse(_currentUserService.UserId!), socialLinks);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == Guid.Parse(_currentUserService.UserId!));

        if (profile is null)
        {
            throw new CustomException("Social profile not found.");
        }

        var validLinks = socialLinks?.Where(link => !string.IsNullOrWhiteSpace(link.Url)).ToList() ?? new List<SocialLinkDto>();
        profile.SocialLinksJson = JsonSerializer.Serialize<IEnumerable<SocialLinkDto>>(validLinks.Any() ? validLinks : Array.Empty<SocialLinkDto>());
        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        var profileDto = MapProfile(profile, false, false, false);
        _logger.LogTrace("Mapped profile DTO: {@profileDto}", profileDto);
        return profileDto;
    }

    public async Task<IEnumerable<SocialProfileDto>> SearchProfilesAsync(string query)
    {
        _logger.LogInformation("CALLED SearchProfilesAsync()");
        _logger.LogDebug("SearchProfilesAsync called with query {Query}", query);

        var cleanQuery = query.Trim();
        if (string.IsNullOrWhiteSpace(cleanQuery))
        {
            return Array.Empty<SocialProfileDto>();
        }

        var lowerQuery = cleanQuery.ToLower();
        var profiles = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Where(p => p.User.DisplayName.ToLower().Contains(lowerQuery))
            .Take(20)
            .ToListAsync();

        return [.. profiles.Select(profile => MapProfile(profile, false, false, false))];
    }

    public async Task<IEnumerable<SocialPostCommentDto>> GetCommentsForPostAsync(Guid postId)
    {
        _logger.LogInformation("CALLED GetCommentsForPostAsync()");
        _logger.LogDebug("GetCommentsForPostAsync called with postId {PostId}", postId);

        var comments = await _dbContext.SocialPostComments
            .Include(c => c.User)
            .Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAtUtc)
            .ToListAsync();

        var commentDtos = comments
            .Select(comment => new SocialPostCommentDto
            {
                Id = comment.Id,
                PostId = comment.PostId,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                CreatedAtUTC = comment.CreatedAtUtc,
                CreatedById = comment.UserId,
                CreatedByName = comment.User.UserName
            })
            .ToDictionary(comment => comment.Id, comment => comment);

        foreach (var commentDto in commentDtos.Values)
        {
            if (commentDto.ParentCommentId.HasValue && commentDtos.TryGetValue(commentDto.ParentCommentId.Value, out var parent))
            {
                parent.Replies.Add(commentDto);
            }
        }

        return commentDtos.Values.Where(comment => !comment.ParentCommentId.HasValue).ToList();
    }

    public async Task<SocialPostCommentDto> CreatePostCommentAsync(CreatePostCommentDto createPostCommentDto)
    {
        _logger.LogInformation("CALLED CreatePostCommentAsync()");
        _logger.LogDebug("CreatePostCommentAsync called with postId {PostId}, parentCommentId {ParentCommentId}, currentUserId {CurrentUserId}", createPostCommentDto.PostId, createPostCommentDto.ParentCommentId, Guid.Parse(_currentUserService.UserId!));

        _logger.LogTrace("Fetching social profile for current user ID {CurrentUserId}", Guid.Parse(_currentUserService.UserId!));
        var profile = await _dbContext.SocialProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == Guid.Parse(_currentUserService.UserId!));
        _logger.LogTrace("Fetched social profile: {profile}", JsonSerializer.Serialize(profile, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for current user ID {CurrentUserId}", Guid.Parse(_currentUserService.UserId!));
            throw new Exception("Social profile not found for the current user.");
        }

        _logger.LogTrace("Fetching post for ID {PostId}", createPostCommentDto.PostId);
        var post = await _dbContext.Posts.FindAsync(createPostCommentDto.PostId);
        _logger.LogTrace("Fetched post: {post}", JsonSerializer.Serialize(post, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", createPostCommentDto.PostId);
            throw new Exception("Post not found.");
        }

        _logger.LogTrace("Checking parent comment for ID {ParentCommentId}", createPostCommentDto.ParentCommentId);
        if (createPostCommentDto.ParentCommentId.HasValue)
        {
            var parentComment = await _dbContext.SocialPostComments.FindAsync(createPostCommentDto.ParentCommentId.Value);
            _logger.LogTrace("Fetched parent comment: {parentComment}", JsonSerializer.Serialize(parentComment, new JsonSerializerOptions
            {
                ReferenceHandler = ReferenceHandler.IgnoreCycles,
                WriteIndented = true
            }));
            if (parentComment is null || parentComment.PostId != createPostCommentDto.PostId)
            {
                _logger.LogWarning("Invalid parent comment {ParentCommentId} for post {PostId}", createPostCommentDto.ParentCommentId, createPostCommentDto.PostId);
                throw new Exception("Invalid parent comment.");
            }
        }

        var commentEntity = new SocialPostCommentEntity
        {
            PostId = createPostCommentDto.PostId,
            UserId = Guid.Parse(_currentUserService.UserId!),
            ParentCommentId = createPostCommentDto.ParentCommentId,
            Content = createPostCommentDto.Content,
            CreatedAtUtc = DateTime.UtcNow
        };
        _logger.LogTrace("Adding new comment entity to database.");
        _dbContext.SocialPostComments.Add(commentEntity);
        post.CommentCount += 1;
        _logger.LogTrace("Updating post's comment count to {CommentCount}", post.CommentCount);
        _dbContext.Posts.Update(post);
        await _dbContext.SaveChangesAsync();
        _logger.LogTrace("Saved new comment and updated post. Calling MapComment.");

        return new SocialPostCommentDto
        {
            Id = commentEntity.Id,
            PostId = commentEntity.PostId,
            ParentCommentId = commentEntity.ParentCommentId,
            Content = commentEntity.Content,
            CreatedAtUTC = commentEntity.CreatedAtUtc,
            CreatedById = commentEntity.UserId,
            CreatedByName = commentEntity.User.UserName,
            Replies = new List<SocialPostCommentDto>()
        };
    }

    public async Task<int> DeletePostCommentAsync(Guid postId, Guid commentId)
    {
        _logger.LogInformation("CALLED DeletePostCommentAsync()");
        _logger.LogDebug("DeletePostCommentAsync called with postId {PostId}, commentId {CommentId}, currentUserId {CurrentUserId}", postId, commentId, Guid.Parse(_currentUserService.UserId!));

        var profile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == Guid.Parse(_currentUserService.UserId!));
        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for current user ID {CurrentUserId}", Guid.Parse(_currentUserService.UserId!));
            throw new Exception("Social profile not found for the current user.");
        }

        var comment = await _dbContext.SocialPostComments.FirstOrDefaultAsync(c => c.Id == commentId && c.PostId == postId);
        if (comment is null)
        {
            _logger.LogWarning("Comment not found for id {CommentId} on post {PostId}", commentId, postId);
            throw new Exception("Comment not found.");
        }

        var post = await _dbContext.Posts.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == postId);
        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            throw new Exception("Post not found.");
        }

        var isAuthor = comment.UserId == Guid.Parse(_currentUserService.UserId!);
        var isPostOwner = post.UserId == Guid.Parse(_currentUserService.UserId!);
        if (!isAuthor && !isPostOwner)
        {
            _logger.LogWarning("User {UserId} is not authorized to delete comment {CommentId}", Guid.Parse(_currentUserService.UserId!), commentId);
            throw new Exception("Not authorized to delete this comment.");
        }

        var toDelete = new List<SocialPostCommentEntity>();
        var queue = new Queue<SocialPostCommentEntity>();
        queue.Enqueue(comment);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            toDelete.Add(current);
            var children = await _dbContext.SocialPostComments.Where(c => c.ParentCommentId == current.Id).ToListAsync();
            foreach (var child in children)
            {
                queue.Enqueue(child);
            }
        }

        _dbContext.SocialPostComments.RemoveRange(toDelete);
        post.CommentCount = Math.Max(0, post.CommentCount - toDelete.Count);
        _dbContext.Posts.Update(post);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} comments for post {PostId}", toDelete.Count, postId);
        return toDelete.Count;
    }

    private SocialPostDto MapPost(SocialPostEntity post, Guid currentProfileId, string? profilePhotoUrl = null)
    {
        _logger.LogInformation("CALLED MapPost()");
        _logger.LogDebug("Mapping post with currentProfileId {CurrentProfileId} and profilePhotoUrl {ProfilePhotoUrl}", currentProfileId, profilePhotoUrl);
        _logger.LogDebug("Mapping post: {Post}", JsonSerializer.Serialize(post, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        if (post == null) throw new ArgumentNullException(nameof(post));
        _logger.LogTrace("Post is not null.");
        _logger.LogTrace("Processing media entries");

        _logger.LogTrace("Returning mapped SocialPostDto");
        var socialPostDto = new SocialPostDto
        {
            Id = post.Id,
            Content = post.Content,
            LoveCount = post.LoveCount,
            CommentCount = post.CommentCount,
            ShareCount = post.ShareCount,
            IsLikedByCurrentUser = post.Likes?.Any(like => like.UserId == currentProfileId) == true,
            CreatedAtUTC = post.CreatedAtUtc,
            CreatedByUserId = post.UserId,
            CreatedByDisplayName = post.User?.DisplayName ?? string.Empty,
            CreatedByUserName = post.User?.UserName ?? string.Empty,
            CreatedByUserProfilePhotoUrl = profilePhotoUrl,
        };

        // Map media entries if any
        if (post.Medias?.Count() > 0)
        {
            socialPostDto.Medias = post.Medias.Select(m => new SocialPostMediaDto
            {
                Id = m.Id,
                MediaGuid = m.MediaGuid,
                ObjectName = m.ObjectName,
                ContentType = m.ContentType,
                Url = _storageService.BuildObjectUrl(m.ObjectName)
            }).ToList();
        }
        _logger.LogTrace("Mapped SocialPostDto: {SocialPostDto}", JsonSerializer.Serialize(socialPostDto, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        return socialPostDto;
    }

    public async Task<SocialPostMediaDto> UploadPostMediaAsync(Guid postId, IFormFile file)
    {
        _logger.LogInformation("CALLED UploadPostMediaAsync()");
        if (_storageService is null)
        {
            _logger.LogWarning("Storage service is not configured for upload");
            throw new InvalidOperationException("Storage service not configured.");
        }

        var post = await _dbContext.Posts.FindAsync(postId);
        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            throw new Exception("Post not found.");
        }

        var mediaEntity = await _storageService.UploadPostMediaAsync(postId, file);
        var url = await _storageService.GetPresignedUrlAsync(mediaEntity.ObjectName);

        return new SocialPostMediaDto
        {
            Id = mediaEntity.Id,
            MediaGuid = mediaEntity.MediaGuid,
            ObjectName = mediaEntity.ObjectName,
            ContentType = mediaEntity.ContentType,
            Url = url
        };
    }

    public async Task<SocialProfileDto> UploadProfileCoverPhotoAsync(IFormFile file)
    {
        _logger.LogInformation("CALLED UploadProfileCoverPhotoAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        if (_storageService is null)
        {
            _logger.LogWarning("Storage service is not configured for upload");
            throw new InvalidOperationException("Storage service not configured.");
        }

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for user ID {UserId}", currentUserId);
            throw new CustomException("Social profile not found.");
        }

        var objectName = await _storageService.UploadFileAsync(file);
        profile.CoverPhotoUrl = _storageService.BuildObjectUrl(objectName);

        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        return MapProfile(profile, false, false, false);
    }

    public async Task<SocialProfileDto> UploadProfilePhotoAsync(IFormFile file)
    {
        _logger.LogInformation("CALLED UploadProfilePhotoAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        if (_storageService is null)
        {
            _logger.LogWarning("Storage service is not configured for upload");
            throw new InvalidOperationException("Storage service not configured.");
        }

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for user ID {UserId}", currentUserId);
            throw new CustomException("Social profile not found.");
        }

        var objectName = await _storageService.UploadFileAsync(file);
        profile.ProfilePhotoUrl = _storageService.BuildObjectUrl(objectName);

        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        return MapProfile(profile, false, false, false);
    }

    public async Task<SocialProfileDto> DeleteProfileCoverPhotoAsync()
    {
        _logger.LogInformation("CALLED DeleteProfileCoverPhotoAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for user ID {UserId}", currentUserId);
            throw new CustomException("Social profile not found.");
        }

        if (!string.IsNullOrWhiteSpace(profile.CoverPhotoUrl) && _storageService is not null)
        {
            var objectName = GetObjectNameFromUrl(profile.CoverPhotoUrl);
            if (!string.IsNullOrWhiteSpace(objectName))
            {
                try
                {
                    await _storageService.DeleteObjectAsync(objectName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete cover photo object {ObjectName} for user {UserId}", objectName, currentUserId);
                }
            }
        }

        profile.CoverPhotoUrl = null;
        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        return MapProfile(profile, false, false, false);
    }

    public async Task<SocialProfileDto> DeleteProfilePhotoAsync()
    {
        _logger.LogInformation("CALLED DeleteProfilePhotoAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for user ID {UserId}", currentUserId);
            throw new CustomException("Social profile not found.");
        }

        if (!string.IsNullOrWhiteSpace(profile.ProfilePhotoUrl) && _storageService is not null)
        {
            var objectName = GetObjectNameFromUrl(profile.ProfilePhotoUrl);
            if (!string.IsNullOrWhiteSpace(objectName))
            {
                try
                {
                    await _storageService.DeleteObjectAsync(objectName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete profile photo object {ObjectName} for user {UserId}", objectName, currentUserId);
                }
            }
        }

        profile.ProfilePhotoUrl = null;
        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        return MapProfile(profile, false, false, false);
    }

    private static string? GetObjectNameFromUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        try
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                return uri.Segments.LastOrDefault()?.Trim('/');
            }

            return url.Split('/').LastOrDefault();
        }
        catch
        {
            return url.Split('/').LastOrDefault();
        }
    }

    public async Task<IEnumerable<SocialPostMediaDto>> GetPostMediaAsync(Guid postId)
    {
        _logger.LogInformation("CALLED GetPostMediaAsync()");
        var mediaList = await _dbContext.PostMedia
            .Where(m => m.PostId == postId)
            .ToListAsync();

        if (mediaList == null || mediaList.Count == 0)
        {
            return Enumerable.Empty<SocialPostMediaDto>();
        }

        if (_storageService is null)
        {
            return mediaList.Select(m => new SocialPostMediaDto
            {
                Id = m.Id,
                MediaGuid = m.MediaGuid,
                ObjectName = m.ObjectName,
                ContentType = m.ContentType
            });
        }

        var results = await Task.WhenAll(mediaList.Select(async m => new SocialPostMediaDto
        {
            Id = m.Id,
            MediaGuid = m.MediaGuid,
            ObjectName = m.ObjectName,
            ContentType = m.ContentType,
            Url = await _storageService.GetPresignedUrlAsync(m.ObjectName)
        }));

        return results;
    }

    public async Task<SocialProfileDto> FollowUserAsync(Guid followingId)
    {
        _logger.LogInformation("CALLED FollowUserAsync()");
        var followerId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("FollowUserAsync called with followerId {FollowerId} and followingId {FollowingId}", followerId, followingId);

        if (followerId == followingId)
        {
            _logger.LogWarning("User {UserId} attempted to follow themselves", followerId);
            throw new Exception("You cannot follow yourself.");
        }

        // Get the social profiles for both users with their navigation properties
        var followerSocialProfile = await _dbContext.SocialProfiles
            .Include(sp => sp.Following)
            .Include(sp => sp.Followers)
            .FirstOrDefaultAsync(sp => sp.UserId == followerId);

        if (followerSocialProfile is null)
        {
            _logger.LogWarning("Social profile not found for follower user ID {FollowerId}", followerId);
            throw new Exception("Follower's social profile not found.");
        }

        var followingSocialProfile = await _dbContext.SocialProfiles
            .Include(sp => sp.Following)
            .Include(sp => sp.Followers)
            .FirstOrDefaultAsync(sp => sp.UserId == followingId);

        if (followingSocialProfile is null)
        {
            _logger.LogWarning("Social profile not found for following user ID {FollowingId}", followingId);
            throw new Exception("User to follow has no social profile.");
        }

        // Get the actual User entities to add to the collections
        var followingUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == followingId);

        if (followingUser is null)
        {
            _logger.LogWarning("Following user not found for ID {FollowingId}", followingId);
            throw new Exception("User to follow not found.");
        }

        var followerUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == followerId);

        if (followerUser is null)
        {
            _logger.LogWarning("Follower user not found for ID {FollowerId}", followerId);
            throw new Exception("Follower user not found.");
        }

        // Check if already following
        var isAlreadyFollowing = followerSocialProfile.Following
            .Any(u => u.Id == followingId);

        if (isAlreadyFollowing)
        {
            _logger.LogWarning("User {FollowerId} is already following {FollowingId}", followerId, followingId);
            throw new Exception("You are already following this user.");
        }

        // Update the relationships
        followerSocialProfile.Following.Add(followingUser);
        followingSocialProfile.Followers.Add(followerUser);

        // Update counts
        followingSocialProfile.FollowersCount++;
        followerSocialProfile.FollowingCount++;

        // Update the social profiles
        _dbContext.SocialProfiles.Update(followerSocialProfile);
        _dbContext.SocialProfiles.Update(followingSocialProfile);

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {FollowerId} successfully followed {FollowingId}", followerId, followingId);

        var result = await GetProfileByIdAsync(followerId);
        return result ?? throw new Exception("Failed to load updated profile after follow.");
    }

    public async Task<SocialProfileDto> UnfollowUserAsync(Guid followingId)
    {
        _logger.LogInformation("CALLED UnfollowUserAsync()");
        var followerId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("UnfollowUserAsync called with followerId {FollowerId} and followingId {FollowingId}", followerId, followingId);

        if (followerId == followingId)
        {
            _logger.LogWarning("User {UserId} attempted to unfollow themselves", followerId);
            throw new Exception("You cannot unfollow yourself.");
        }

        var followerProfile = await _dbContext.SocialProfiles
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == followerId);

        _logger.LogTrace("Fetched follower profile: {@followerProfile}", JsonSerializer.Serialize(followerProfile, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));

        if (followerProfile is null)
        {
            _logger.LogWarning("Follower profile not found for user ID {FollowerId}", followerId);
            throw new Exception("Follower profile not found.");
        }

        var followingProfile = await _dbContext.SocialProfiles
            .Include(p => p.Followers)
            .FirstOrDefaultAsync(p => p.UserId == followingId);
        _logger.LogTrace("Fetched following profile: {@followingProfile}", JsonSerializer.Serialize(followingProfile, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));

        if (followingProfile is null)
        {
            _logger.LogWarning("Following profile not found for user ID {FollowingId}", followingId);
            throw new Exception("User to unfollow not found.");
        }

        var isFollowing = followerProfile.Following.Any(user => user.Id == followingProfile.UserId);
        if (!isFollowing)
        {
            _logger.LogWarning("User {FollowerId} is not following {FollowingId}", followerId, followingId);
            throw new Exception("You are not following this user.");
        }
        // Get the actual User entities to add to the collections
        var followingUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == followingId);

        if (followingUser is null)
        {
            _logger.LogWarning("Following user not found for ID {FollowingId}", followingId);
            throw new Exception("User to follow not found.");
        }

        var followerUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == followerId);

        if (followerUser is null)
        {
            _logger.LogWarning("Follower user not found for ID {FollowerId}", followerId);
            throw new Exception("Follower user not found.");
        }

        followerProfile.Following.Remove(followingUser);
        followingProfile.Followers.Remove(followerUser);
        followingProfile.FollowersCount = Math.Max(0, followingProfile.FollowersCount - 1);
        followerProfile.FollowingCount = Math.Max(0, followerProfile.FollowingCount - 1);

        _dbContext.SocialProfiles.Update(followerProfile);
        _dbContext.SocialProfiles.Update(followingProfile);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {FollowerId} successfully unfollowed {FollowingId}", followerId, followingId);

        var result = await GetProfileByIdAsync(followerId);
        return result ?? throw new Exception("Failed to load updated profile after unfollow.");
    }

    public async Task<bool> IsFollowingAsync(Guid followingId)
    {
        _logger.LogInformation("CALLED IsFollowingAsync()");
        var followerId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("IsFollowingAsync called with followerId {FollowerId} and followingId {FollowingId}", followerId, followingId);

        var followerProfile = await _dbContext.SocialProfiles
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == followerId);

        if (followerProfile is null)
        {
            return false;
        }

        var followingProfile = await _dbContext.SocialProfiles
            .FirstOrDefaultAsync(p => p.UserId == followingId);

        if (followingProfile is null)
        {
            return false;
        }

        var isFollowing = followerProfile.Following.Any(p => p.Id == followingProfile.UserId);
        _logger.LogDebug("IsFollowing result: {IsFollowing}", isFollowing);
        return isFollowing;
    }

    public async Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetFollowersAsync()");
        _logger.LogDebug("GetFollowersAsync called with userId {UserId}", userId);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.Followers)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", userId);
            return Enumerable.Empty<FollowerDto>();
        }

        var followers = profile.Followers.Select(f => new FollowerDto
        {
            Id = f.Id,
            UserId = f.Id,
            UserName = f.UserName,
            DisplayName = f.DisplayName,
            ProfilePictureUrl = f.ProfilePictureUrl,
            CoverPhotoUrl = null,
            Bio = null,
            FollowersCount = 0,
            FollowingCount = 0
        }).ToList();

        _logger.LogInformation("Retrieved {Count} followers for user {UserId}", followers.Count, userId);
        return followers;
    }

    public async Task<IEnumerable<FollowerDto>> GetFriendsAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetFriendsAsync()");
        _logger.LogDebug("GetFriendsAsync called with userId {UserId}", userId);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", userId);
            return Enumerable.Empty<FollowerDto>();
        }

        var friends = profile.Friends.Select(friend => new FollowerDto
        {
            Id = friend.Id,
            UserId = friend.Id,
            UserName = friend.UserName,
            DisplayName = friend.DisplayName,
            ProfilePictureUrl = friend.ProfilePictureUrl,
            CoverPhotoUrl = null,
            Bio = null,
            FollowersCount = friend.RatingCount ?? 0,
            FollowingCount = 0
        }).ToList();

        _logger.LogInformation("Retrieved {Count} friends for user {UserId}", friends.Count, userId);
        return friends;
    }

    public async Task<IEnumerable<FollowingDto>> GetFollowingAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetFollowingAsync()");
        _logger.LogDebug("GetFollowingAsync called with userId {UserId}", userId);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", userId);
            return Enumerable.Empty<FollowingDto>();
        }

        var following = profile.Following.Select(f => new FollowingDto
        {
            Id = f.Id,
            UserId = f.Id,
            UserName = f.UserName,
            DisplayName = f.DisplayName,
            ProfilePictureUrl = f.ProfilePictureUrl,
            CoverPhotoUrl = profile.CoverPhotoUrl,
            Bio = profile.Bio,
            FollowersCount = 0,
            FollowingCount = 0
        }).ToList();

        _logger.LogInformation("Retrieved {Count} following for user {UserId}", following.Count, userId);
        return following;
    }

    public async Task<SocialProfileDto> AddFriendRequestAsync(Guid userId)
    {
        _logger.LogInformation("CALLED AddFriendRequestAsync()");
        var fromUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("AddFriendRequestAsync called with fromUserId {FromUserId} and toUserId {ToUserId}", fromUserId, userId);

        var fromProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == fromUserId);
        if (fromProfile is null)
        {
            _logger.LogWarning("From profile not found for user ID {FromUserId}", fromUserId);
            throw new Exception("Your profile not found.");
        }

        var toProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (toProfile is null)
        {
            _logger.LogWarning("To profile not found for ID {ToUserId}", userId);
            throw new Exception("User profile not found.");
        }

        if (fromProfile.Id == toProfile.Id)
        {
            _logger.LogWarning("User {UserId} attempted to send friend request to themselves", fromUserId);
            throw new Exception("You cannot send a friend request to yourself.");
        }

        var existingRequest = await _dbContext.FriendRequests
            .FirstOrDefaultAsync(r => r.FromUserId == fromProfile.UserId && r.ToUserId == toProfile.UserId && r.Status == FriendRequestStatus.Pending);

        if (existingRequest is not null)
        {
            _logger.LogWarning("Friend request already exists from {FromUserId} to {ToUserId}", fromProfile.UserId, toProfile.UserId);
            throw new Exception("Friend request already exists.");
        }

        var request = new FriendRequestEntity
        {
            Id = Guid.NewGuid(),
            FromUserId = fromProfile.UserId,
            ToUserId = toProfile.UserId,
            Status = FriendRequestStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Empty
        };

        _dbContext.FriendRequests.Add(request);
        await _dbContext.SaveChangesAsync();

        // Automatically follow the recipient when sending a friend request.
        if (!await IsFollowingAsync(toProfile.UserId))
        {
            _logger.LogInformation("Automatically following recipient {ToUserId} after friend request from {FromUserId}", toProfile.UserId, fromUserId);
            await FollowUserAsync(toProfile.UserId);
        }

        _logger.LogInformation("Friend request sent from user {FromUserId} to user {ToUserId}", fromProfile.UserId, toProfile.UserId);

        var result = await GetProfileByIdAsync(toProfile.UserId);
        return result ?? throw new Exception("Failed to load updated profile after sending friend request.");
    }

    public async Task<SocialProfileDto> ApproveFriendRequestAsync(Guid requestId)
    {
        _logger.LogInformation("CALLED ApproveFriendRequestAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("ApproveFriendRequestAsync called with requestId {RequestId}", requestId);

        var request = await _dbContext.FriendRequests
            .Include(r => r.FromUser)
            .Include(r => r.ToUser)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null)
        {
            _logger.LogWarning("Friend request not found for ID {RequestId}", requestId);
            throw new Exception("Friend request not found.");
        }

        var toProfile = await _dbContext.SocialProfiles
            .Include(p => p.Friends)
            .Include(p => p.Followers)
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (toProfile is null || toProfile.UserId != request.ToUserId)
        {
            _logger.LogWarning("Unauthorized: User {CurrentUserId} cannot approve request {RequestId}", currentUserId, requestId);
            throw new Exception("You are not authorized to approve this request.");
        }

        var fromProfile = await _dbContext.SocialProfiles
            .Include(p => p.Friends)
            .Include(p => p.Followers)
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == request.FromUserId);

        if (fromProfile is null)
        {
            _logger.LogWarning("From profile not found for request {RequestId}", requestId);
            throw new Exception("Requester profile not found.");
        }

        request.Status = FriendRequestStatus.Approved;
        request.RespondedAtUTC = DateTime.UtcNow;

        // Add to Friends list
        if (!toProfile.Friends.Any(f => f.Id == fromProfile.Id))
        {
            toProfile.Friends.Add(request.FromUser);
        }

        if (!fromProfile.Friends.Any(f => f.Id == toProfile.Id))
        {
            fromProfile.Friends.Add(request.ToUser);
        }

        // Ensure mutual following once the friend request is accepted.
        var fromUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == fromProfile.UserId);
        var toUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == toProfile.UserId);

        if (fromUser is null || toUser is null)
        {
            _logger.LogWarning("Unable to resolve user accounts for mutual follow on friend approval {RequestId}", requestId);
        }
        else
        {
            if (!toProfile.Following.Any(u => u.Id == fromProfile.UserId))
            {
                toProfile.Following.Add(fromUser);
                toProfile.FollowingCount++;
            }

            if (!fromProfile.Followers.Any(u => u.Id == toProfile.UserId))
            {
                fromProfile.Followers.Add(toUser);
                fromProfile.FollowersCount++;
            }

            if (!fromProfile.Following.Any(u => u.Id == toProfile.UserId))
            {
                fromProfile.Following.Add(toUser);
                fromProfile.FollowingCount++;
            }

            if (!toProfile.Followers.Any(u => u.Id == fromProfile.UserId))
            {
                toProfile.Followers.Add(fromUser);
                toProfile.FollowersCount++;
            }
        }

        _dbContext.FriendRequests.Update(request);
        _dbContext.SocialProfiles.Update(toProfile);
        _dbContext.SocialProfiles.Update(fromProfile);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Friend request {RequestId} approved, users {FromProfileId} and {ToProfileId} are now friends and mutually following", requestId, fromProfile.Id, toProfile.Id);

        var result = await GetProfileByIdAsync(fromProfile.UserId);
        return result ?? throw new Exception("Failed to load updated profile after approving friend request.");
    }

    public async Task<SocialProfileDto> RejectFriendRequestAsync(Guid requestId)
    {
        _logger.LogInformation("CALLED RejectFriendRequestAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("RejectFriendRequestAsync called with requestId {RequestId} and currentUserId {CurrentUserId}", requestId, currentUserId);

        var request = await _dbContext.FriendRequests
            .Include(r => r.ToUser)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null)
        {
            _logger.LogWarning("Friend request not found for ID {RequestId}", requestId);
            throw new Exception("Friend request not found.");
        }

        var toProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (toProfile is null || toProfile.UserId != request.ToUserId)
        {
            _logger.LogWarning("Unauthorized: User {CurrentUserId} cannot reject request {RequestId}", currentUserId, requestId);
            throw new Exception("You are not authorized to reject this request.");
        }

        request.Status = FriendRequestStatus.Rejected;
        request.RespondedAtUTC = DateTime.UtcNow;

        _dbContext.FriendRequests.Update(request);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Friend request {RequestId} rejected", requestId);

        var result = await GetProfileByIdAsync(request.FromUserId);
        return result ?? throw new Exception("Failed to load updated profile after rejecting friend request.");
    }

    public async Task<SocialProfileDto> CancelFriendRequestAsync(Guid userId)
    {
        _logger.LogInformation("CALLED CancelFriendRequestAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("CancelFriendRequestAsync called with fromUserId {FromUserId} and toUserId {ToUserId}", currentUserId, userId);

        var friendRequest = await _dbContext.FriendRequests
            .FirstOrDefaultAsync(r => ((r.FromUserId == currentUserId && r.ToUserId == userId) || (r.FromUserId == userId && r.ToUserId == currentUserId)) && r.Status == FriendRequestStatus.Pending);

        if (friendRequest is null)
        {
            _logger.LogWarning("No pending friend request found from {FromUserId} to {ToUserId}", currentUserId, userId);
            throw new Exception("No pending friend request found.");
        }

        await _dbContext.FriendRequests.Where(r => r.Id == friendRequest.Id).ExecuteDeleteAsync();

        _logger.LogInformation("Friend request from {FromUserId} to {ToUserId} cancelled", currentUserId, userId);

        var result = await GetProfileByIdAsync(userId);
        return result ?? throw new Exception("Failed to load updated profile after cancelling friend request.");
    }

    public async Task<SocialProfileDto> RemoveFriendAsync(Guid friendUserId)
    {
        _logger.LogInformation("CALLED RemoveFriendAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("RemoveFriendAsync called with currentUserId {CurrentUserId} and friendUserId {FriendUserId}", currentUserId, friendUserId);

        if (currentUserId == friendUserId)
        {
            _logger.LogWarning("User {UserId} attempted to remove themselves as a friend", currentUserId);
            throw new Exception("You cannot unfriend yourself.");
        }

        var currentProfile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Friends)
            .Include(p => p.Followers)
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        var friendProfile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Friends)
            .Include(p => p.Followers)
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == friendUserId);

        if (currentProfile is null || friendProfile is null)
        {
            _logger.LogWarning("Unable to find profiles for unfriend operation: {CurrentUserId}, {FriendUserId}", currentUserId, friendUserId);
            throw new Exception("Unable to remove friend because one or both profiles are missing.");
        }

        if (currentProfile.Friends.Any(f => f.Id == friendProfile.UserId))
        {
            currentProfile.Friends.Remove(friendProfile.User);
        }

        if (friendProfile.Friends.Any(f => f.Id == currentProfile.UserId))
        {
            friendProfile.Friends.Remove(currentProfile.User);
        }

        if (currentProfile.Following.Any(u => u.Id == friendProfile.UserId))
        {
            currentProfile.Following.Remove(friendProfile.User);
            currentProfile.FollowingCount = Math.Max(0, currentProfile.FollowingCount - 1);
        }

        if (friendProfile.Followers.Any(u => u.Id == currentProfile.UserId))
        {
            friendProfile.Followers.Remove(currentProfile.User);
            friendProfile.FollowersCount = Math.Max(0, friendProfile.FollowersCount - 1);
        }

        if (friendProfile.Following.Any(u => u.Id == currentProfile.UserId))
        {
            friendProfile.Following.Remove(currentProfile.User);
            friendProfile.FollowingCount = Math.Max(0, friendProfile.FollowingCount - 1);
        }

        if (currentProfile.Followers.Any(u => u.Id == friendProfile.UserId))
        {
            currentProfile.Followers.Remove(friendProfile.User);
            currentProfile.FollowersCount = Math.Max(0, currentProfile.FollowersCount - 1);
        }

        _dbContext.SocialProfiles.Update(currentProfile);
        _dbContext.SocialProfiles.Update(friendProfile);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Users {CurrentUserId} and {FriendUserId} are no longer friends", currentUserId, friendUserId);

        var result = await GetProfileByIdAsync(friendUserId);
        return result ?? throw new Exception("Failed to load updated profile after removing friend.");
    }

    public async Task<IEnumerable<PendingFriendRequestDto>> GetPendingFriendRequestsAsync()
    {
        _logger.LogInformation("CALLED GetPendingFriendRequestsAsync()");
        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        _logger.LogDebug("GetPendingFriendRequestsAsync called with userId {UserId}", currentUserId);

        var profile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);
        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", currentUserId);
            return Enumerable.Empty<PendingFriendRequestDto>();
        }

        var requests = await _dbContext.FriendRequests
            .Include(r => r.FromUser)
            .Where(r => r.ToUserId == profile.UserId && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();

        var result = requests.Select(r => new PendingFriendRequestDto
        {
            Id = r.Id,
            FromProfileId = r.FromUser.Id,
            FromUserId = r.FromUser.Id,
            FromUserName = r.FromUser.UserName,
            FromDisplayName = r.FromUser.DisplayName,
            FromProfilePictureUrl = r.FromUser.ProfilePictureUrl,
            FromCoverPhotoUrl = "",
            FromBio = "",
            CreatedAtUTC = r.CreatedAtUtc
        }).ToList();

        _logger.LogInformation("Retrieved {Count} pending friend requests for user {UserId}", result.Count, currentUserId);
        return result;
    }

    private static SocialProfileDto MapProfile(SocialProfileEntity profile, bool isFriend, bool isFriendRequestPending, bool isFollowing)
    {
        var socialLinks = string.IsNullOrWhiteSpace(profile.SocialLinksJson)
            ? Enumerable.Empty<SocialLinkDto>()
            : JsonSerializer.Deserialize<IEnumerable<SocialLinkDto>>(profile.SocialLinksJson) ?? Enumerable.Empty<SocialLinkDto>();

        return new SocialProfileDto
        {
            Id = profile.Id,
            UserId = profile.User.Id,
            UserName = profile.User.UserName,
            DisplayName = profile.User.DisplayName,
            CoverPhotoUrl = profile.CoverPhotoUrl,
            ProfilePhotoUrl = profile.ProfilePhotoUrl,
            AvatarUrl = !string.IsNullOrWhiteSpace(profile.ProfilePhotoUrl)
                ? profile.ProfilePhotoUrl
                : profile.User.ProfilePictureUrl,
            Bio = profile.Bio,
            FollowersCount = profile.FollowersCount,
            FollowingCount = profile.FollowingCount,
            GarageCount = profile.GarageCount,
            RidesCount = profile.RidesCount,
            GarageDistance = profile.GarageDistance,
            GarageDuration = profile.GarageDuration,
            GarageElevation = profile.GarageElevation,
            RideDistance = profile.RideDistance,
            RideDuration = profile.RideDuration,
            RideElevation = profile.RideElevation,
            SocialLinks = socialLinks,
            IsFriend = isFriend,
            IsFriendRequestPending = isFriendRequestPending,
            IsFollowing = isFollowing
        };
    }
}
