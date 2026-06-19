using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
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
    Task<SocialProfileDto?> GetProfileByIdAsync(Guid userId);
    Task<IEnumerable<SocialProfileDto>> SearchProfilesAsync(string query);
    Task<SocialPostDto?> TogglePostLoveAsync(Guid postId, Guid currentUserId);
    Task<IEnumerable<SocialPostCommentDto>> GetCommentsForPostAsync(Guid postId);
    Task<SocialPostCommentDto> CreatePostCommentAsync(Guid currentUserId, CreatePostCommentDto createPostCommentDto);
    Task<int> DeletePostCommentAsync(Guid currentUserId, Guid postId, Guid commentId);
    Task<FollowResponseDto> FollowUserAsync(Guid followerId, Guid followingId);
    Task<FollowResponseDto> UnfollowUserAsync(Guid followerId, Guid followingId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followingId);
    Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId);
    Task<IEnumerable<FollowingDto>> GetFollowingAsync(Guid userId);
    Task<FriendRequestResponseDto> SendFriendRequestAsync(Guid fromUserId, Guid toProfileId);
    Task<FriendRequestResponseDto> ApproveFriendRequestAsync(Guid requestId, Guid currentUserId);
    Task<FriendRequestResponseDto> RejectFriendRequestAsync(Guid requestId, Guid currentUserId);
    Task<IEnumerable<PendingFriendRequestDto>> GetPendingFriendRequestsAsync(Guid userId);
}

public class SocialService : ISocialService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<SocialService> _logger;

    public SocialService(AppDbContext dbContext, ILogger<SocialService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
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
            .Include(p => p.SocialProfile)
                .ThenInclude(sp => sp.User)
            .Include(p => p.Likes)
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
            .Include(p => p.SocialProfile)
                .ThenInclude(sp => sp.User)
            .Include(p => p.Likes)
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
            .Include(p => p.SocialProfile)
                .ThenInclude(sp => sp.User)
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
        var profile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == createPostDto.CreatedById);
        if (profile is null)
        {
            _logger.LogWarning("Social profile not found for user ID {CreatedById}", createPostDto.CreatedById);
            throw new Exception("Social profile not found for the given user ID.");
        }
        var postEntity = new SocialPostEntity
        {
            Content = createPostDto.Content,
            ImageUrlsJson = createPostDto.ImageUrls == null ? null : JsonSerializer.Serialize(createPostDto.ImageUrls),
            SocialProfileId = profile.Id,
            SocialProfile = profile
        };

        _dbContext.Posts.Add(postEntity);
        await _dbContext.SaveChangesAsync();

        return MapPost(postEntity, null);
    }

    public async Task<SocialPostDto?> TogglePostLoveAsync(Guid postId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED TogglePostLoveAsync()");
        _logger.LogDebug("TogglePostLoveAsync called with postId {PostId} and currentUserId {CurrentUserId}", postId, currentUserId);

        var currentProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(profile => profile.UserId == currentUserId);
        if (currentProfile is null)
        {
            _logger.LogWarning("Social profile not found for current user ID {CurrentUserId}", currentUserId);
            throw new Exception("Social profile not found for the current user.");
        }

        var post = await _dbContext.Posts
            .Include(p => p.Likes)
            .Include(p => p.SocialProfile)
                .ThenInclude(sp => sp.User)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            return null;
        }

        var existingLike = post.Likes.FirstOrDefault(like => like.LikedByProfileId == currentProfile.Id);
        if (existingLike is null)
        {
            _logger.LogInformation("Adding like for post {PostId} by profile {ProfileId}", postId, currentProfile.Id);
            post.Likes.Add(new SocialPostLikeEntity
            {
                PostId = postId,
                LikedByProfileId = currentProfile.Id,
                LikedAtUTC = DateTime.UtcNow
            });
            post.LoveCount += 1;
        }
        else
        {
            _logger.LogInformation("Removing like for post {PostId} by profile {ProfileId}", postId, currentProfile.Id);
            _dbContext.SocialPostLikes.Remove(existingLike);
            post.Likes.Remove(existingLike);
            post.LoveCount = Math.Max(0, post.LoveCount - 1);
        }

        _dbContext.Posts.Update(post);
        await _dbContext.SaveChangesAsync();

        return MapPost(post, currentProfile.Id);
    }

    public async Task<SocialProfileDto?> GetProfileByIdAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetProfileByIdAsync()");
        _logger.LogDebug("GetProfileByIdAsync called with userId {UserId}", userId);
        var profile = await _dbContext.SocialProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == userId);
        _logger.LogTrace("Fetched profile: {profile}", JsonSerializer.Serialize(profile, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        if (profile == null) return null;
        var profileDto = MapProfile(profile);
        _logger.LogTrace("Mapped profile DTO: {profileDto}", JsonSerializer.Serialize(profileDto, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
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

        return profiles.Select(MapProfile).ToList();
    }

    public async Task<IEnumerable<SocialPostCommentDto>> GetCommentsForPostAsync(Guid postId)
    {
        _logger.LogInformation("CALLED GetCommentsForPostAsync()");
        _logger.LogDebug("GetCommentsForPostAsync called with postId {PostId}", postId);

        var comments = await _dbContext.SocialPostComments
            .Include(c => c.CreatedByProfile)
                .ThenInclude(profile => profile.User)
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
                CreatedById = comment.CreatedByProfile.UserId,
                CreatedByName = comment.CreatedByProfile.User.UserName
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
            CreatedByProfileId = profile.Id,
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
            CreatedById = profile.UserId,
            CreatedByName = profile.User.UserName,
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

        var post = await _dbContext.Posts.Include(p => p.SocialProfile).FirstOrDefaultAsync(p => p.Id == postId);
        if (post is null)
        {
            _logger.LogWarning("Post not found for ID {PostId}", postId);
            throw new Exception("Post not found.");
        }

        var isAuthor = comment.CreatedByProfileId == profile.Id;
        var isPostOwner = post.SocialProfile != null && post.SocialProfile.UserId == currentUserId;
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
            ? Enumerable.Empty<string>()
            : JsonSerializer.Deserialize<IEnumerable<string>>(post.ImageUrlsJson) ?? Enumerable.Empty<string>();

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
            IsLikedByCurrentUser = currentProfileId.HasValue && post.Likes?.Any(like => like.LikedByProfileId == currentProfileId.Value) == true,
            CreatedAtUTC = post.CreatedAtUTC,
            CreatedByUserId = post.SocialProfile?.UserId ?? Guid.Empty,
            CreatedByDisplayName = post.SocialProfile?.User?.DisplayName ?? string.Empty,
            CreatedByUserName = post.SocialProfile?.User?.UserName ?? string.Empty
        };
        _logger.LogTrace("Mapped SocialPostDto: {SocialPostDto}", JsonSerializer.Serialize(socialPostDto, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        return socialPostDto;
    }

    public async Task<FollowResponseDto> FollowUserAsync(Guid followerId, Guid followingId)
    {
        _logger.LogInformation("CALLED FollowUserAsync()");
        _logger.LogDebug("FollowUserAsync called with followerId {FollowerId} and followingId {FollowingId}", followerId, followingId);

        if (followerId == followingId)
        {
            _logger.LogWarning("User {UserId} attempted to follow themselves", followerId);
            throw new Exception("You cannot follow yourself.");
        }

        var followerProfile = await _dbContext.SocialProfiles
            .Include(p => p.Following)
            .FirstOrDefaultAsync(p => p.UserId == followerId);
        
        if (followerProfile is null)
        {
            _logger.LogWarning("Follower profile not found for user ID {FollowerId}", followerId);
            throw new Exception("Follower profile not found.");
        }

        var followingProfile = await _dbContext.SocialProfiles
            .Include(p => p.Followers)
            .FirstOrDefaultAsync(p => p.UserId == followingId);
        
        if (followingProfile is null)
        {
            _logger.LogWarning("Following profile not found for user ID {FollowingId}", followingId);
            throw new Exception("User to follow not found.");
        }

        var isAlreadyFollowing = followerProfile.Following.Any(p => p.Id == followingProfile.Id);
        if (isAlreadyFollowing)
        {
            _logger.LogWarning("User {FollowerId} is already following {FollowingId}", followerId, followingId);
            throw new Exception("You are already following this user.");
        }

        followerProfile.Following.Add(followingProfile);
        followingProfile.Followers.Add(followerProfile);
        followingProfile.FollowersCount++;
        followerProfile.FollowingCount++;

        _dbContext.SocialProfiles.Update(followerProfile);
        _dbContext.SocialProfiles.Update(followingProfile);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {FollowerId} successfully followed {FollowingId}", followerId, followingId);
        
        return new FollowResponseDto
        {
            IsFollowing = true,
            FollowersCount = followingProfile.FollowersCount,
            FollowingCount = followingProfile.FollowingCount
        };
    }

    public async Task<FollowResponseDto> UnfollowUserAsync(Guid followerId, Guid followingId)
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
        
        if (followerProfile is null)
        {
            _logger.LogWarning("Follower profile not found for user ID {FollowerId}", followerId);
            throw new Exception("Follower profile not found.");
        }

        var followingProfile = await _dbContext.SocialProfiles
            .Include(p => p.Followers)
            .FirstOrDefaultAsync(p => p.UserId == followingId);
        
        if (followingProfile is null)
        {
            _logger.LogWarning("Following profile not found for user ID {FollowingId}", followingId);
            throw new Exception("User to unfollow not found.");
        }

        var isFollowing = followerProfile.Following.Any(p => p.Id == followingProfile.Id);
        if (!isFollowing)
        {
            _logger.LogWarning("User {FollowerId} is not following {FollowingId}", followerId, followingId);
            throw new Exception("You are not following this user.");
        }

        followerProfile.Following.Remove(followingProfile);
        followingProfile.Followers.Remove(followerProfile);
        followingProfile.FollowersCount = Math.Max(0, followingProfile.FollowersCount - 1);
        followerProfile.FollowingCount = Math.Max(0, followerProfile.FollowingCount - 1);

        _dbContext.SocialProfiles.Update(followerProfile);
        _dbContext.SocialProfiles.Update(followingProfile);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {FollowerId} successfully unfollowed {FollowingId}", followerId, followingId);
        
        return new FollowResponseDto
        {
            IsFollowing = false,
            FollowersCount = followingProfile.FollowersCount,
            FollowingCount = followingProfile.FollowingCount
        };
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

        var isFollowing = followerProfile.Following.Any(p => p.Id == followingProfile.Id);
        _logger.LogDebug("IsFollowing result: {IsFollowing}", isFollowing);
        return isFollowing;
    }

    public async Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetFollowersAsync()");
        _logger.LogDebug("GetFollowersAsync called with userId {UserId}", userId);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.Followers)
                .ThenInclude(f => f.User)
            .FirstOrDefaultAsync(p => p.UserId == userId);
        
        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", userId);
            return Enumerable.Empty<FollowerDto>();
        }

        var followers = profile.Followers.Select(f => new FollowerDto
        {
            Id = f.Id,
            UserId = f.User.Id,
            UserName = f.User.UserName,
            DisplayName = f.User.DisplayName,
            ProfilePictureUrl = f.User.ProfilePictureUrl,
            CoverPhotoUrl = f.CoverPhotoUrl,
            Bio = f.Bio,
            FollowersCount = f.FollowersCount,
            FollowingCount = f.FollowingCount
        }).ToList();

        _logger.LogInformation("Retrieved {Count} followers for user {UserId}", followers.Count, userId);
        return followers;
    }

    public async Task<IEnumerable<FollowingDto>> GetFollowingAsync(Guid userId)
    {
        _logger.LogInformation("CALLED GetFollowingAsync()");
        _logger.LogDebug("GetFollowingAsync called with userId {UserId}", userId);

        var profile = await _dbContext.SocialProfiles
            .Include(p => p.Following)
                .ThenInclude(f => f.User)
            .FirstOrDefaultAsync(p => p.UserId == userId);
        
        if (profile is null)
        {
            _logger.LogWarning("Profile not found for user ID {UserId}", userId);
            return Enumerable.Empty<FollowingDto>();
        }

        var following = profile.Following.Select(f => new FollowingDto
        {
            Id = f.Id,
            UserId = f.User.Id,
            UserName = f.User.UserName,
            DisplayName = f.User.DisplayName,
            ProfilePictureUrl = f.User.ProfilePictureUrl,
            CoverPhotoUrl = f.CoverPhotoUrl,
            Bio = f.Bio,
            FollowersCount = f.FollowersCount,
            FollowingCount = f.FollowingCount
        }).ToList();

        _logger.LogInformation("Retrieved {Count} following for user {UserId}", following.Count, userId);
        return following;
    }

    public async Task<FriendRequestResponseDto> SendFriendRequestAsync(Guid fromUserId, Guid toProfileId)
    {
        _logger.LogInformation("CALLED SendFriendRequestAsync()");
        _logger.LogDebug("SendFriendRequestAsync called with fromUserId {FromUserId} and toProfileId {ToProfileId}", fromUserId, toProfileId);

        var fromProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == fromUserId);
        if (fromProfile is null)
        {
            _logger.LogWarning("From profile not found for user ID {FromUserId}", fromUserId);
            throw new Exception("Your profile not found.");
        }

        var toProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.Id == toProfileId);
        if (toProfile is null)
        {
            _logger.LogWarning("To profile not found for ID {ToProfileId}", toProfileId);
            throw new Exception("User profile not found.");
        }

        if (fromProfile.Id == toProfile.Id)
        {
            _logger.LogWarning("User {UserId} attempted to send friend request to themselves", fromUserId);
            throw new Exception("You cannot send a friend request to yourself.");
        }

        var existingRequest = await _dbContext.FriendRequests
            .FirstOrDefaultAsync(r => r.FromProfileId == fromProfile.Id && r.ToProfileId == toProfile.Id && r.Status == FriendRequestStatus.Pending);
        
        if (existingRequest is not null)
        {
            _logger.LogWarning("Friend request already exists from {FromProfileId} to {ToProfileId}", fromProfile.Id, toProfile.Id);
            throw new Exception("Friend request already exists.");
        }

        var request = new FriendRequestEntity
        {
            Id = Guid.NewGuid(),
            FromProfileId = fromProfile.Id,
            ToProfileId = toProfile.Id,
            Status = FriendRequestStatus.Pending,
            CreatedAtUTC = DateTime.UtcNow,
            CreatedById = Guid.Empty
        };

        _dbContext.FriendRequests.Add(request);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Friend request sent from {FromProfileId} to {ToProfileId}", fromProfile.Id, toProfile.Id);
        
        return new FriendRequestResponseDto
        {
            RequestId = request.Id,
            Success = true,
            Status = "Pending",
            Message = "Friend request sent successfully."
        };
    }

    public async Task<FriendRequestResponseDto> ApproveFriendRequestAsync(Guid requestId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED ApproveFriendRequestAsync()");
        _logger.LogDebug("ApproveFriendRequestAsync called with requestId {RequestId} and currentUserId {CurrentUserId}", requestId, currentUserId);

        var request = await _dbContext.FriendRequests
            .Include(r => r.FromProfile)
            .Include(r => r.ToProfile)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null)
        {
            _logger.LogWarning("Friend request not found for ID {RequestId}", requestId);
            throw new Exception("Friend request not found.");
        }

        var toProfile = await _dbContext.SocialProfiles
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (toProfile is null || toProfile.Id != request.ToProfileId)
        {
            _logger.LogWarning("Unauthorized: User {CurrentUserId} cannot approve request {RequestId}", currentUserId, requestId);
            throw new Exception("You are not authorized to approve this request.");
        }

        var fromProfile = await _dbContext.SocialProfiles
            .Include(p => p.Friends)
            .FirstOrDefaultAsync(p => p.Id == request.FromProfileId);

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
            toProfile.Friends.Add(fromProfile);
        }

        if (!fromProfile.Friends.Any(f => f.Id == toProfile.Id))
        {
            fromProfile.Friends.Add(toProfile);
        }

        _dbContext.FriendRequests.Update(request);
        _dbContext.SocialProfiles.Update(toProfile);
        _dbContext.SocialProfiles.Update(fromProfile);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Friend request {RequestId} approved, users {FromProfileId} and {ToProfileId} are now friends", requestId, fromProfile.Id, toProfile.Id);

        return new FriendRequestResponseDto
        {
            RequestId = request.Id,
            Success = true,
            Status = "Approved",
            Message = "Friend request approved successfully."
        };
    }

    public async Task<FriendRequestResponseDto> RejectFriendRequestAsync(Guid requestId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED RejectFriendRequestAsync()");
        _logger.LogDebug("RejectFriendRequestAsync called with requestId {RequestId} and currentUserId {CurrentUserId}", requestId, currentUserId);

        var request = await _dbContext.FriendRequests
            .Include(r => r.ToProfile)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null)
        {
            _logger.LogWarning("Friend request not found for ID {RequestId}", requestId);
            throw new Exception("Friend request not found.");
        }

        var toProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (toProfile is null || toProfile.Id != request.ToProfileId)
        {
            _logger.LogWarning("Unauthorized: User {CurrentUserId} cannot reject request {RequestId}", currentUserId, requestId);
            throw new Exception("You are not authorized to reject this request.");
        }

        request.Status = FriendRequestStatus.Rejected;
        request.RespondedAtUTC = DateTime.UtcNow;

        _dbContext.FriendRequests.Update(request);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Friend request {RequestId} rejected", requestId);

        return new FriendRequestResponseDto
        {
            RequestId = request.Id,
            Success = true,
            Status = "Rejected",
            Message = "Friend request rejected successfully."
        };
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
            .Include(r => r.FromProfile)
                .ThenInclude(p => p.User)
            .Where(r => r.ToProfileId == profile.Id && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAtUTC)
            .ToListAsync();

        var result = requests.Select(r => new PendingFriendRequestDto
        {
            Id = r.Id,
            FromProfileId = r.FromProfile.Id,
            FromUserId = r.FromProfile.User.Id,
            FromUserName = r.FromProfile.User.UserName,
            FromDisplayName = r.FromProfile.User.DisplayName,
            FromProfilePictureUrl = r.FromProfile.User.ProfilePictureUrl,
            FromCoverPhotoUrl = r.FromProfile.CoverPhotoUrl,
            FromBio = r.FromProfile.Bio,
            CreatedAtUTC = r.CreatedAtUTC
        }).ToList();

        _logger.LogInformation("Retrieved {Count} pending friend requests for user {UserId}", result.Count, userId);
        return result;
    }

    private static SocialProfileDto MapProfile(SocialProfileEntity profile)
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
            SocialLinks = socialLinks
        };
    }
}
