using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface IBlogService
{
    Task<PaginatedResultDto<BlogDto>> GetBlogsAsync(int page, int pageSize);
    Task<BlogDto?> GetBlogByIdAsync(int id);
    Task<BlogDto> CreateBlogAsync(CreateBlogDto dto);
}

public class BlogService : IBlogService
{
    private readonly AppDbContext _dbContext;

    public BlogService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<BlogDto>> GetBlogsAsync(int page, int pageSize)
    {
        var query = _dbContext.Blogs.OrderByDescending(blog => blog.CreatedAt);
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

    public async Task<BlogDto?> GetBlogByIdAsync(int id)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        return blog is null ? null : MapBlog(blog);
    }

    public async Task<BlogDto> CreateBlogAsync(CreateBlogDto dto)
    {
        var blog = new Blog
        {
            Title = dto.Title,
            Summary = dto.Summary,
            Content = dto.Content,
            ImageUrl = dto.ImageUrl,
            Author = dto.Author,
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Blogs.Add(blog);
        await _dbContext.SaveChangesAsync();
        return MapBlog(blog);
    }

    private static BlogDto MapBlog(Blog blog)
    {
        return new BlogDto(
            blog.Id,
            blog.Title,
            blog.Summary,
            blog.Content,
            blog.ImageUrl,
            blog.Author,
            blog.CreatedAt
        );
    }
}
