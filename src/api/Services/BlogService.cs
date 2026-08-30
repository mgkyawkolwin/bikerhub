using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

public interface IBlogService
{
    Task<PaginatedResultDto<BlogDto>> GetBlogsAsync(int page, int pageSize);
    Task<BlogDto?> GetBlogByIdAsync(Guid id);
    Task<BlogDto> CreateBlogAsync(CreateBlogDto dto);
    Task<BlogDto?> UpdateBlogAsync(Guid id, UpdateBlogDto dto);
    Task<bool> DeleteBlogAsync(Guid id);
}

public class BlogService : IBlogService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<BlogService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public BlogService(AppDbContext dbContext, ILogger<BlogService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<BlogDto>> GetBlogsAsync(int page, int pageSize)
    {
        var query = _dbContext.Blogs.OrderByDescending(blog => blog.CreatedAtUtc);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<BlogDto>(
            items.Select(MapBlog).ToList(),
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize))
        );
    }

    public async Task<BlogDto?> GetBlogByIdAsync(Guid id)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        return blog is null ? null : MapBlog(blog);
    }

    public async Task<BlogDto?> UpdateBlogAsync(Guid id, UpdateBlogDto dto)
    {
        if (dto is null)
        {
            throw new CustomException("UpdateBlogDto cannot be null.");
        }

        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog is null)
        {
            return null;
        }

        if (dto.Title is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.Title, "Title");
            blog.Title = dto.Title;
        }

        if (dto.Content is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.Content, "Content");
            blog.Content = dto.Content;
        }

        if (dto.CoverImageUrl is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.CoverImageUrl, "CoverImageUrl");
            blog.CoverImageUrl = dto.CoverImageUrl;
        }

        if (dto.PostType.HasValue)
        {
            blog.PostType = dto.PostType.Value;
        }

        blog.UpdatedAtUtc = DateTime.UtcNow;
        blog.UpdatedById = Guid.Parse(_currentUserService.UserId!);

        await _dbContext.SaveChangesAsync();

        return MapBlog(blog);
    }

    public async Task<bool> DeleteBlogAsync(Guid id)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog is null)
        {
            return false;
        }

        _dbContext.Blogs.Remove(blog);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<BlogDto> CreateBlogAsync(CreateBlogDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Title, "Title");

        var blog = new BlogEntity
        {
            Title = dto.Title,
            Content = dto.Content,
            CoverImageUrl = dto.CoverImageUrl,
            PostType = dto.PostType,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };

        _dbContext.Blogs.Add(blog);
        await _dbContext.SaveChangesAsync();
        return MapBlog(blog);
    }

    private static BlogDto MapBlog(BlogEntity blog)
    {
        return new BlogDto(
            blog.Id,
            blog.Title,
            blog.Content,
            blog.CoverImageUrl,
            blog.PostType,
            blog.Media?.Select(media => new MediaDto
            {
                Id = media.Id,
                OwnerId = media.OwnerId,
                ObjectName = media.ObjectName,
                ContentType = media.ContentType,
                Size = media.Size,
                Url = null
            }),
            blog.CreatedAtUtc,
            blog.CreatedById,
            blog.UpdatedAtUtc,
            blog.UpdatedById
        );
    }
}
