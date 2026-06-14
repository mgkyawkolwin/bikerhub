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
    Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(int page, int pageSize, Guid? currentUserId = null);
    Task<PaginatedResultDto<SocialPostDto>> GetPostsByCreatorAsync(Guid createdById, int page, int pageSize, Guid? currentUserId = null);
    Task<SocialPostDto> CreatePostAsync(CreatePostDto createPostDto);
    Task<SocialProfileDto?> GetProfileByIdAsync(int id);
    Task<SocialPostDto?> TogglePostLoveAsync(Guid postId, Guid currentUserId);
    Task<IEnumerable<SocialPostCommentDto>> GetCommentsForPostAsync(Guid postId);
    Task<SocialPostCommentDto> CreatePostCommentAsync(Guid currentUserId, CreatePostCommentDto createPostCommentDto);
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

    public async Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(int page, int pageSize, Guid? currentUserId = null)
    {
        _logger.LogInformation("CALLED GetPostsAsync()");
        _logger.LogDebug("GetPostsAsync called with page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", page, pageSize, currentUserId);

        Guid? currentProfileId = null;
        if (currentUserId.HasValue)
        {
            _logger.LogTrace("Fetching current profile ID for user ID {CurrentUserId}", currentUserId);
            currentProfileId = await _dbContext.SocialProfiles
                .Where(profile => profile.UserId == currentUserId.Value)
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
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        _logger.LogTrace("Fetched {Count} posts from database", items.Count);
        _logger.LogTrace("First post details: {PostDetails}", items.Count > 0
    ? JsonSerializer.Serialize(items[0], new JsonSerializerOptions
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = true
    })
    : "No posts");
        return new PaginatedResultDto<SocialPostDto>(items.Select(post => MapPost(post, currentProfileId)).ToList(), page, pageSize, total, Pagination.GetTotalPages(total, pageSize));
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetPostsByCreatorAsync(Guid createdByUserId, int page, int pageSize, Guid? currentUserId = null)
    {
        _logger.LogInformation("CALLED GetPostsByCreatorAsync()");
        _logger.LogDebug("GetPostsByCreatorAsync called with userId {UserId}, page {Page}, pageSize {PageSize}, and currentUserId {CurrentUserId}", createdByUserId, page, pageSize, currentUserId);

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

        var query = _dbContext.Posts
            .Include(post => post.SocialProfile)
                .ThenInclude(profile => profile.User)
            .Include(post => post.Likes)
            .Where(post => post.SocialProfile.UserId == createdByUserId)
            .OrderByDescending(post => post.CreatedAtUTC);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<SocialPostDto>(items.Select(post => MapPost(post, currentProfileId)).ToList(), page, pageSize, total,
            Pagination.GetTotalPages(total, pageSize));
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

    public async Task<SocialProfileDto?> GetProfileByIdAsync(int id)
    {
        _logger.LogInformation("CALLED GetProfileByIdAsync()");
        _logger.LogDebug("GetProfileByIdAsync called with id {Id}", id);
        var profile = await _dbContext.SocialProfiles.FindAsync(id);
        return profile is null ? null : MapProfile(profile);
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
                CreatedByName = comment.CreatedByProfile.User.Name
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
            CreatedByName = profile.User.Name,
            Replies = new List<SocialPostCommentDto>()
        };
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
            CreatedById = post.SocialProfile?.UserId ?? Guid.Empty,
            CreatedByName = post.SocialProfile?.User?.Name ?? string.Empty
        };
        _logger.LogTrace("Mapped SocialPostDto: {SocialPostDto}", JsonSerializer.Serialize(socialPostDto, new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = true
        }));
        return socialPostDto;
    }

    private static SocialProfileDto MapProfile(SocialProfileEntity profile)
    {
        var socialLinks = string.IsNullOrWhiteSpace(profile.SocialLinksJson)
            ? Enumerable.Empty<SocialLinkDto>()
            : JsonSerializer.Deserialize<IEnumerable<SocialLinkDto>>(profile.SocialLinksJson) ?? Enumerable.Empty<SocialLinkDto>();

        return new SocialProfileDto
        {
            Id = profile.Id,
            CreatedById = profile.User.Id,
            CreatedByName = profile.User.Name,
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
