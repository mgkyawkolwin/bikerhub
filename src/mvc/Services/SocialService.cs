using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Utilities;
using System.Text.Json.Serialization;

namespace BikerHub.Services;

public interface ISocialService
{
    Task<PaginatedResultDto<SocialPostDto>> GetFeedsAsync(SocialPostsFilterDto filterDto);
    Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(SocialPostsFilterDto filterDto);
    Task<SocialPostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null);
    // Task<PaginatedResultDto<SocialPostDto>> GetPostsByCreatorAsync(Guid createdById, int page, int pageSize, Guid? currentUserId = null);
    Task<SocialPostDto> CreatePostAsync(CreatePostDto createPostDto);
    Task<SocialPostMediaDto> UploadPostMediaAsync(Guid postId, IFormFile file);
    Task<SocialProfileDto> UploadProfileCoverPhotoAsync(Guid currentUserId, IFormFile file);
    Task<SocialProfileDto> UploadProfilePhotoAsync(Guid currentUserId, IFormFile file);
    Task<IEnumerable<SocialPostMediaDto>> GetPostMediaAsync(Guid postId);
    Task<SocialProfileDto?> GetProfileByIdAsync(Guid userId, Guid currentUserId);
    Task<SocialProfileDto> UpdateSocialLinksAsync(Guid currentUserId, IEnumerable<SocialLinkDto> socialLinks);
    Task<IEnumerable<SocialProfileDto>> SearchProfilesAsync(string query);
    Task<SocialPostDto?> TogglePostLoveAsync(Guid postId, Guid currentUserId);
    Task<IEnumerable<SocialPostCommentDto>> GetCommentsForPostAsync(Guid postId);
    Task<SocialPostCommentDto> CreatePostCommentAsync(Guid currentUserId, CreatePostCommentDto createPostCommentDto);
    Task<int> DeletePostCommentAsync(Guid currentUserId, Guid postId, Guid commentId);
    Task<SocialProfileDto> FollowUserAsync(Guid followerId, Guid followingId);
    Task<SocialProfileDto> UnfollowUserAsync(Guid followerId, Guid followingId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followingId);
    Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId);
    Task<IEnumerable<FollowerDto>> GetFriendsAsync(Guid userId);
    Task<IEnumerable<FollowingDto>> GetFollowingAsync(Guid userId);
    Task<SocialProfileDto> AddFriendRequestAsync(Guid fromUserId, Guid toProfileId);
    Task<SocialProfileDto> ApproveFriendRequestAsync(Guid requestId, Guid currentUserId);
    Task<SocialProfileDto> RejectFriendRequestAsync(Guid requestId, Guid currentUserId);
    Task<SocialProfileDto> CancelFriendRequestAsync(Guid fromUserId, Guid toUserId);
    Task<SocialProfileDto> RemoveFriendAsync(Guid currentUserId, Guid friendUserId);
    Task<IEnumerable<PendingFriendRequestDto>> GetPendingFriendRequestsAsync(Guid userId);
}

public class SocialService : ISocialService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<SocialService> _logger;
    private readonly IStorageService? _storageService;
    private readonly BikerHub.Models.MinioSettings? _minioSettings;

    public SocialService(AppDbContext dbContext, ILogger<SocialService> logger, IStorageService? storageService = null, Microsoft.Extensions.Options.IOptions<BikerHub.Models.MinioSettings>? minioOptions = null)
    {
        _dbContext = dbContext;
        _logger = logger;
        _storageService = storageService;
        _minioSettings = minioOptions?.Value;
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetFeedsAsync(SocialPostsFilterDto filterDto)
    {
        _logger.LogInformation("CALLED GetFeedsAsync()");
        _logger.LogDebug("GetFeedsAsync called with page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", filterDto.Page, filterDto.PageSize, filterDto.UserId);

        Guid? currentProfileId = null;
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
                currentProfileId = null;
            }
        }

        var query = _dbContext.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Media)
            .OrderByDescending(post => post.CreatedAtUTC);

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
        return new PaginatedResultDto<SocialPostDto>(items.Select(post => MapPost(post, currentProfileId)).ToList(), filterDto.Page, filterDto.PageSize, total, Pagination.GetTotalPages(total, filterDto.PageSize));
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(SocialPostsFilterDto filterDto)
    {
        _logger.LogInformation("CALLED GetPostsAsync()");
        _logger.LogDebug("GetPostsAsync called with page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", filterDto.Page, filterDto.PageSize, filterDto.UserId);

        Guid? currentProfileId = null;
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
                currentProfileId = null;
            }
        }

        var query = _dbContext.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Media)
            .Where(post => post.UserId == filterDto.UserId)
            .OrderByDescending(post => post.CreatedAtUTC);

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
        return new PaginatedResultDto<SocialPostDto>(items.Select(post => MapPost(post, currentProfileId)).ToList(), filterDto.Page, filterDto.PageSize, total, Pagination.GetTotalPages(total, filterDto.PageSize));
    }

    // public async Task<PaginatedResultDto<SocialPostDto>> GetPostsByCreatorAsync(Guid createdByUserId, int page, int pageSize, Guid? currentUserId = null)
    // {
    //     _logger.LogInformation("CALLED GetPostsByCreatorAsync()");
    //     _logger.LogDebug("GetPostsByCreatorAsync called with userId {UserId}, page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", createdByUserId, page, pageSize, currentUserId);

    //     Guid? currentProfileId = null;
    //     if (currentUserId.HasValue)
    //     {
    //         currentProfileId = await _dbContext.SocialProfiles
    //             .Where(profile => profile.UserId == currentUserId.Value)
    //             .Select(profile => profile.Id)
    //             .FirstOrDefaultAsync();

    //         if (currentProfileId == Guid.Empty)
    //         {
    //             currentProfileId = null;
    //         }
    //     }

    //     var query = _dbContext.Posts
    //         .Include(post => post.SocialProfile)
    //             .ThenInclude(profile => profile.User)
    //         .Include(post => post.Likes)
    //         .Where(post => post.SocialProfile.UserId == createdByUserId)
    //         .OrderByDescending(post => post.CreatedAtUTC);

    //     var total = await query.CountAsync();
    //     var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

    //     return new PaginatedResultDto<SocialPostDto>(items.Select(post => MapPost(post, currentProfileId)).ToList(), page, pageSize, total,
    //         Pagination.GetTotalPages(total, pageSize));
    // }

    public async Task<SocialPostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        _logger.LogInformation("CALLED GetPostByIdAsync()");
        _logger.LogDebug("GetPostByIdAsync called with postId {PostId} and currentUserId {CurrentUserId}", postId, currentUserId);

        Guid? currentProfileId = null;
        if (currentUserId.HasValue)
        {
            currentProfileId = await _dbContext.SocialProfiles
                .Where(profile => profile.UserId == currentUserId.Value)
                .Select(profile => profile.Id)
                .FirstOrDefaultAsync();
            if (currentProfileId == Guid.Empty)
            {
                currentProfileId = null;
            }
        }

        var post = await _dbContext.Posts
            .Include(p => p.Likes)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            return null;
        }

        return MapPost(post, currentProfileId);
    }

    public async Task<SocialPostDto> CreatePostAsync(CreatePostDto createPostDto)
    {
        _logger.LogInformation("CALLED CreatePostAsync()");
        _logger.LogDebug("CreatePostAsync called with createdByUserId {CreatedById}", createPostDto.CreatedById);
        var profile = await _dbContext.Users.FirstOrDefaultAsync(p => p.Id == createPostDto.CreatedById);
        if (profile is null)
        {
            _logger.LogWarning("User not found for ID {CreatedById}", createPostDto.CreatedById);
            throw new Exception("User not found for the given user ID.");
        }
        var postEntity = new SocialPostEntity
        {
            Content = createPostDto.Content,
            ImageUrlsJson = createPostDto.ImageUrls == null ? null : JsonSerializer.Serialize(createPostDto.ImageUrls),
            UserId = profile.Id,
            User = profile
        };

        _dbContext.Posts.Add(postEntity);
        await _dbContext.SaveChangesAsync();

        return MapPost(postEntity, null);
    }

    public async Task<SocialPostDto?> TogglePostLoveAsync(Guid postId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED TogglePostLoveAsync()");
        _logger.LogDebug("TogglePostLoveAsync called with postId {PostId} and currentUserId {CurrentUserId}", postId, currentUserId);

        // var currentProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(profile => profile.UserId == currentUserId);
        // if (currentProfile is null)
        // {
        //     _logger.LogWarning("Social profile not found for current user ID {CurrentUserId}", currentUserId);
        //     throw new Exception("Social profile not found for the current user.");
        // }

        var post = await _dbContext.Posts
            .Include(p => p.Likes)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            return null;
        }

        var existingLike = post.Likes.FirstOrDefault(like => like.UserId == currentUserId);
        if (existingLike is null)
        {
            _logger.LogInformation("Adding like for post {PostId} by user {UserId}", postId, currentUserId);
            post.Likes.Add(new SocialPostLikeEntity
            {
                PostId = postId,
                UserId = currentUserId,
                LikedAtUTC = DateTime.UtcNow
            });
            post.LoveCount += 1;
        }
        else
        {
            _logger.LogInformation("Removing like for post {PostId} by user {UserId}", postId, currentUserId);
            _dbContext.SocialPostLikes.Remove(existingLike);
            post.Likes.Remove(existingLike);
            post.LoveCount = Math.Max(0, post.LoveCount - 1);
        }

        _dbContext.Posts.Update(post);
        await _dbContext.SaveChangesAsync();

        return MapPost(post, currentUserId);
    }

    public async Task<SocialProfileDto?> GetProfileByIdAsync(Guid userId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED GetProfileByIdAsync()");
        _logger.LogDebug("GetProfileByIdAsync called with userId {UserId} and currentUserId {CurrentUserId}", userId, currentUserId);
        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == userId);
        _logger.LogTrace("Fetched profile: {@profile}", profile);
        if (profile == null) {
            _logger.LogWarning("Social profile not found for user ID {UserId}", userId);
            return null;
        }

        var isFriend = false;
        var isFollowing = false;
        var isFriendRequestPending = false;

        isFriend = profile.Friends.Any(friend => friend.Id == currentUserId);
        isFollowing = profile.Followers.Any(follower => follower.Id == currentUserId);
        isFriendRequestPending = await _dbContext.FriendRequests.AnyAsync(r =>
            r.Status == FriendRequestStatus.Pending &&
            ((r.FromUserId == currentUserId && r.ToUserId == profile.UserId) ||
             (r.FromUserId == profile.UserId && r.ToUserId == currentUserId)));

        var profileDto = MapProfile(profile, isFriend, isFriendRequestPending, isFollowing);
        _logger.LogTrace("Mapped profile DTO: {@profileDto}", profileDto);
        return profileDto;
    }

    public async Task<SocialProfileDto> UpdateSocialLinksAsync(Guid currentUserId, IEnumerable<SocialLinkDto> socialLinks)
    {
        _logger.LogInformation("CALLED UpdateSocialLinksAsync()");
        _logger.LogDebug("UpdateSocialLinksAsync called with currentUserId {CurrentUserId} and socialLinks {@SocialLinks}", currentUserId, socialLinks);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.User)
            .Include(p => p.Followers)
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

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
            .OrderBy(c => c.CreatedAtUTC)
            .ToListAsync();

        var commentDtos = comments
            .Select(comment => new SocialPostCommentDto
            {
                Id = comment.Id,
                PostId = comment.PostId,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                CreatedAtUTC = comment.CreatedAtUTC,
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

    public async Task<SocialPostCommentDto> CreatePostCommentAsync(Guid currentUserId, CreatePostCommentDto createPostCommentDto)
    {
        _logger.LogInformation("CALLED CreatePostCommentAsync()");
        _logger.LogDebug("CreatePostCommentAsync called with postId {PostId}, parentCommentId {ParentCommentId}, currentUserId {CurrentUserId}", createPostCommentDto.PostId, createPostCommentDto.ParentCommentId, currentUserId);

        _logger.LogTrace("Fetching social profile for current user ID {CurrentUserId}", currentUserId);
        var profile = await _dbContext.SocialProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == currentUserId);
        _logger.LogTrace("Fetched social profile: {profile}", JsonSerializer.Serialize(profile, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for current user ID {CurrentUserId}", currentUserId);
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
            UserId = currentUserId,
            ParentCommentId = createPostCommentDto.ParentCommentId,
            Content = createPostCommentDto.Content,
            CreatedAtUTC = DateTime.UtcNow
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
            CreatedAtUTC = commentEntity.CreatedAtUTC,
            CreatedById = commentEntity.UserId,
            CreatedByName = commentEntity.User.UserName,
            Replies = new List<SocialPostCommentDto>()
        };
    }

    public async Task<int> DeletePostCommentAsync(Guid currentUserId, Guid postId, Guid commentId)
    {
        _logger.LogInformation("CALLED DeletePostCommentAsync()");
        _logger.LogDebug("DeletePostCommentAsync called with postId {PostId}, commentId {CommentId}, currentUserId {CurrentUserId}", postId, commentId, currentUserId);

        var profile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);
        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for current user ID {CurrentUserId}", currentUserId);
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

        var isAuthor = comment.UserId == currentUserId;
        var isPostOwner = post.UserId == currentUserId;
        if (!isAuthor && !isPostOwner)
        {
            _logger.LogWarning("User {UserId} is not authorized to delete comment {CommentId}", currentUserId, commentId);
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

    private SocialPostDto MapPost(SocialPostEntity post, Guid? currentProfileId = null)
    {
        _logger.LogInformation("CALLED MapPost()");
        _logger.LogDebug("Mapping post with currentProfileId {CurrentProfileId}", currentProfileId);
        _logger.LogDebug("Mapping post: {Post}", JsonSerializer.Serialize(post, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        if (post == null) throw new ArgumentNullException(nameof(post));
        _logger.LogTrace("Post is not null.");
        _logger.LogTrace("Processing image urls: {urls}", post.ImageUrlsJson ?? "null");
        var imageUrls = string.IsNullOrWhiteSpace(post.ImageUrlsJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<IEnumerable<string>>(post.ImageUrlsJson)?.ToList() ?? new List<string>();

        if (post.Media?.Any() == true && _minioSettings is not null)
        {
            var baseUrl = _minioSettings.ServerAddress?.TrimEnd('/');
            if (!string.IsNullOrWhiteSpace(baseUrl))
            {
                var mediaUrls = post.Media.Select(m => $"{_minioSettings.ObjectBaseUrl}{baseUrl}/{_minioSettings.BucketName}/{m.ObjectName}");
                imageUrls.AddRange(mediaUrls);
            }
        }

        _logger.LogTrace("Mapped image urls: {urls}", JsonSerializer.Serialize(imageUrls));
        _logger.LogTrace("Returning mapped SocialPostDto");
        var socialPostDto = new SocialPostDto
        {
            Id = post.Id,
            Content = post.Content,
            ImageUrls = imageUrls,
            LoveCount = post.LoveCount,
            CommentCount = post.CommentCount,
            ShareCount = post.ShareCount,
            IsLikedByCurrentUser = currentProfileId.HasValue && post.Likes?.Any(like => like.UserId == currentProfileId.Value) == true,
            CreatedAtUTC = post.CreatedAtUTC,
            CreatedByUserId = post.UserId,
            CreatedByDisplayName = post.User?.DisplayName ?? string.Empty,
            CreatedByUserName = post.User?.UserName ?? string.Empty
        };

        // Map media entries if any
        if (post.Media?.Any() == true)
        {
            var baseUrl = _minioSettings is null ? null : _minioSettings.ServerAddress?.TrimEnd('/');
            socialPostDto.Media = post.Media.Select(m => new SocialPostMediaDto
            {
                Id = m.Id,
                MediaGuid = m.MediaGuid,
                ObjectName = m.ObjectName,
                ContentType = m.ContentType,
                Url = baseUrl is null ? null : $"{baseUrl}/{_minioSettings!.BucketName}/{m.ObjectName}"
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

    public async Task<SocialProfileDto> UploadProfileCoverPhotoAsync(Guid currentUserId, IFormFile file)
    {
        _logger.LogInformation("CALLED UploadProfileCoverPhotoAsync()");
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
        profile.CoverPhotoUrl = BuildObjectUrl(objectName);

        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        return MapProfile(profile, false, false, false);
    }

    public async Task<SocialProfileDto> UploadProfilePhotoAsync(Guid currentUserId, IFormFile file)
    {
        _logger.LogInformation("CALLED UploadProfilePhotoAsync()");
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
        profile.ProfilePhotoUrl = BuildObjectUrl(objectName);

        _dbContext.SocialProfiles.Update(profile);
        await _dbContext.SaveChangesAsync();

        return MapProfile(profile, false, false, false);
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

    private string BuildObjectUrl(string objectName)
    {
        if (_minioSettings is null)
        {
            return objectName;
        }

        var baseUrl = _minioSettings.ServerAddress?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return objectName;
        }

        return $"{_minioSettings.ObjectBaseUrl}{baseUrl}/{_minioSettings.BucketName}/{objectName}";
    }

    public async Task<SocialProfileDto> FollowUserAsync(Guid followerId, Guid followingId)
    {
        _logger.LogInformation("CALLED FollowUserAsync()");
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

        var result = await GetProfileByIdAsync(followingId, followerId);
        return result ?? throw new Exception("Failed to load updated profile after follow.");
    }

    public async Task<SocialProfileDto> UnfollowUserAsync(Guid followerId, Guid followingId)
    {
        _logger.LogInformation("CALLED UnfollowUserAsync()");
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

        var result = await GetProfileByIdAsync(followingId, followerId);
        return result ?? throw new Exception("Failed to load updated profile after unfollow.");
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followingId)
    {
        _logger.LogInformation("CALLED IsFollowingAsync()");
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

    public async Task<SocialProfileDto> AddFriendRequestAsync(Guid fromUserId, Guid toUserId)
    {
        _logger.LogInformation("CALLED SendFriendRequestAsync()");
        _logger.LogDebug("SendFriendRequestAsync called with fromUserId {FromUserId} and toProfileId {ToProfileId}", fromUserId, toUserId);

        var fromProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == fromUserId);
        if (fromProfile is null)
        {
            _logger.LogWarning("From profile not found for user ID {FromUserId}", fromUserId);
            throw new Exception("Your profile not found.");
        }

        var toProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == toUserId);
        if (toProfile is null)
        {
            _logger.LogWarning("To profile not found for ID {toUserId}", toUserId);
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
            CreatedAtUTC = DateTime.UtcNow,
            CreatedById = Guid.Empty
        };

        _dbContext.FriendRequests.Add(request);
        await _dbContext.SaveChangesAsync();

        // Automatically follow the recipient when sending a friend request.
        if (!await IsFollowingAsync(fromUserId, toProfile.UserId))
        {
            _logger.LogInformation("Automatically following recipient {ToUserId} after friend request from {FromUserId}", toProfile.UserId, fromUserId);
            await FollowUserAsync(fromUserId, toProfile.UserId);
        }

        _logger.LogInformation("Friend request sent from user {FromUserId} to user {ToUserId}", fromProfile.UserId, toProfile.UserId);

        var result = await GetProfileByIdAsync(toProfile.UserId, fromUserId);
        return result ?? throw new Exception("Failed to load updated profile after sending friend request.");
    }

    public async Task<SocialProfileDto> ApproveFriendRequestAsync(Guid requestId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED ApproveFriendRequestAsync()");
        _logger.LogDebug("ApproveFriendRequestAsync called with requestId {RequestId} and currentUserId {CurrentUserId}", requestId, currentUserId);

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

        var result = await GetProfileByIdAsync(fromProfile.UserId, currentUserId);
        return result ?? throw new Exception("Failed to load updated profile after approving friend request.");
    }

    public async Task<SocialProfileDto> RejectFriendRequestAsync(Guid requestId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED RejectFriendRequestAsync()");
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

        var result = await GetProfileByIdAsync(request.FromUserId, currentUserId);
        return result ?? throw new Exception("Failed to load updated profile after rejecting friend request.");
    }

    public async Task<SocialProfileDto> CancelFriendRequestAsync(Guid fromUserId, Guid toUserId)
    {
        _logger.LogInformation("CALLED CancelFriendRequestAsync()");
        _logger.LogDebug("CancelFriendRequestAsync called with fromUserId {FromUserId} and toUserId {ToUserId}", fromUserId, toUserId);

        var friendRequest = await _dbContext.FriendRequests
            .FirstOrDefaultAsync(r => r.FromUserId == fromUserId && r.ToUserId == toUserId && r.Status == FriendRequestStatus.Pending);

        if (friendRequest is null)
        {
            _logger.LogWarning("No pending friend request found from {FromUserId} to {ToUserId}", fromUserId, toUserId);
            throw new Exception("No pending friend request found.");
        }

        await _dbContext.FriendRequests.Where(r => r.Id == friendRequest.Id).ExecuteDeleteAsync();

        _logger.LogInformation("Friend request from {FromUserId} to {ToUserId} cancelled", fromUserId, toUserId);

        var result = await GetProfileByIdAsync(toUserId, fromUserId);
        return result ?? throw new Exception("Failed to load updated profile after cancelling friend request.");
    }

    public async Task<SocialProfileDto> RemoveFriendAsync(Guid currentUserId, Guid friendUserId)
    {
        _logger.LogInformation("CALLED RemoveFriendAsync()");
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

        var result = await GetProfileByIdAsync(friendUserId, currentUserId);
        return result ?? throw new Exception("Failed to load updated profile after removing friend.");
    }

    public async Task<IEnumerable<PendingFriendRequestDto>> GetPendingFriendRequestsAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetPendingFriendRequestsAsync()");
        _logger.LogDebug("GetPendingFriendRequestsAsync called with userId {UserId}", userId);

        var profile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", userId);
            return Enumerable.Empty<PendingFriendRequestDto>();
        }

        var requests = await _dbContext.FriendRequests
            .Include(r => r.FromUser)
            .Where(r => r.ToUserId == profile.UserId && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAtUTC)
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
            CreatedAtUTC = r.CreatedAtUTC
        }).ToList();

        _logger.LogInformation("Retrieved {Count} pending friend requests for user {UserId}", result.Count, userId);
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
