using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface ISocialService
{
    Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(int page, int pageSize);
    Task<PaginatedResultDto<SocialPostDto>> GetPostsByAuthorAsync(string authorId, int page, int pageSize);
    Task<SocialProfileDto?> GetProfileByIdAsync(int id);
}

public class SocialService : ISocialService
{
    private readonly AppDbContext _dbContext;

    public SocialService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetPostsAsync(int page, int pageSize)
    {
        var query = _dbContext.SocialPosts.OrderByDescending(post => post.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PaginatedResultDto<SocialPostDto>(items.Select(MapPost).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<PaginatedResultDto<SocialPostDto>> GetPostsByAuthorAsync(string authorId, int page, int pageSize)
    {
        var query = _dbContext.SocialPosts.Where(post => post.AuthorId == authorId).OrderByDescending(post => post.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PaginatedResultDto<SocialPostDto>(items.Select(MapPost).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<SocialProfileDto?> GetProfileByIdAsync(int id)
    {
        var profile = await _dbContext.SocialProfiles.FindAsync(id);
        return profile is null ? null : MapProfile(profile);
    }

    private static SocialPostDto MapPost(SocialPost post)
    {
        var imageUrls = string.IsNullOrWhiteSpace(post.ImageUrlsJson)
            ? Enumerable.Empty<string>()
            : JsonSerializer.Deserialize<IEnumerable<string>>(post.ImageUrlsJson) ?? Enumerable.Empty<string>();

        return new SocialPostDto(
            post.Id,
            post.AuthorId,
            post.AuthorName,
            post.AuthorAvatarUrl,
            post.GroupId,
            post.Content,
            imageUrls,
            post.LoveCount,
            post.CommentCount,
            post.ShareCount,
            post.CreatedAt
        );
    }

    private static SocialProfileDto MapProfile(SocialProfile profile)
    {
        var socialLinks = string.IsNullOrWhiteSpace(profile.SocialLinksJson)
            ? Enumerable.Empty<SocialLinkDto>()
            : JsonSerializer.Deserialize<IEnumerable<SocialLinkDto>>(profile.SocialLinksJson) ?? Enumerable.Empty<SocialLinkDto>();

        return new SocialProfileDto(
            profile.Id,
            profile.Name,
            profile.CoverPhotoUrl,
            profile.AvatarUrl,
            profile.Bio,
            profile.FollowersCount,
            profile.FollowingCount,
            profile.GarageCount,
            profile.RidesCount,
            profile.GarageDistance,
            profile.GarageDuration,
            profile.GarageElevation,
            profile.RideDistance,
            profile.RideDuration,
            profile.RideElevation,
            socialLinks
        );
    }
}
