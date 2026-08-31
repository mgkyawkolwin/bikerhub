using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Extensions;

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
    private const string BlogTypeCategory = "BLOG_TYPE";

    private readonly AppDbContext _dbContext;
    private readonly ILogger<BlogService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;

    public BlogService(AppDbContext dbContext, ILogger<BlogService> logger, ICurrentUserService currentUserService, IStorageService storageService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _currentUserService = currentUserService;
        _storageService = storageService;
    }

    public async Task<PaginatedResultDto<BlogDto>> GetBlogsAsync(int page, int pageSize)
    {
        var query = _dbContext.Blogs.OrderByDescending(blog => blog.CreatedAtUtc);
        var total = await query.CountAsync();
        var items = (await query.Skip((page - 1) * pageSize).Take(pageSize).ProjectToDto(_dbContext).ToListAsync()).ResolveMediaUrls(_storageService);

        return new PaginatedResultDto<BlogDto>(
            items,
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize))
        );
    }

    public async Task<BlogDto?> GetBlogByIdAsync(Guid id)
    {
        return (await _dbContext.Blogs
            .Where(blog => blog.Id == id)
            .ProjectToDto(_dbContext)
            .FirstOrDefaultAsync())
            .ResolveMediaUrls(_storageService);
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

        if (dto.AuthorName is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.AuthorName, "AuthorName");
            blog.AuthorName = dto.AuthorName;
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

        if (dto.PostType is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.PostType, "PostType");
            blog.PostTypeId = await ResolvePostTypeIdAsync(dto.PostType);
        }

        blog.UpdatedAtUtc = DateTime.UtcNow;
        blog.UpdatedById = Guid.Parse(_currentUserService.UserId!);

        await _dbContext.SaveChangesAsync();

        return (await _dbContext.Blogs
            .Where(x => x.Id == blog.Id)
            .ProjectToDto(_dbContext)
            .FirstOrDefaultAsync())
            .ResolveMediaUrls(_storageService);
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
        DtoValidationHelper.ValidateRequiredString(dto.AuthorName, "AuthorName");
        DtoValidationHelper.ValidateRequiredString(dto.PostType, "PostType");

        var postTypeId = await ResolvePostTypeIdAsync(dto.PostType);

        var blog = new BlogEntity
        {
            Title = dto.Title,
            AuthorName = dto.AuthorName,
            Content = dto.Content,
            CoverImageUrl = dto.CoverImageUrl,
            PostTypeId = postTypeId,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };

        _dbContext.Blogs.Add(blog);
        await _dbContext.SaveChangesAsync();
        return (await _dbContext.Blogs
            .Where(x => x.Id == blog.Id)
            .ProjectToDto(_dbContext)
            .FirstAsync())
            .ResolveMediaUrls(_storageService)!;
    }

    private async Task<Guid> ResolvePostTypeIdAsync(string? postType)
    {
        var normalizedType = string.IsNullOrWhiteSpace(postType)
            ? "GENERAL"
            : postType.Trim().ToUpperInvariant().Replace(' ', '_');

        var lookup = await _dbContext.LookUps
            .FirstOrDefaultAsync(x => x.Category == BlogTypeCategory && x.Code == normalizedType);

        if (lookup is not null)
        {
            return lookup.Id;
        }

        var newLookup = new LookUpEntity
        {
            Id = Guid.NewGuid(),
            Category = BlogTypeCategory,
            Code = normalizedType,
            Value = string.IsNullOrWhiteSpace(postType) ? "General" : postType.Trim()
        };

        _dbContext.LookUps.Add(newLookup);
        await _dbContext.SaveChangesAsync();

        return newLookup.Id;
    }
}
