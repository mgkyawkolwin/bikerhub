using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Services;

public interface INewsService
{
    Task<PaginatedResultDto<NewsDto>> GetNewsAsync(int page, int pageSize);
    Task<NewsDto?> GetNewsByIdAsync(int id);
}

public class NewsService : INewsService
{
    private readonly AppDbContext _dbContext;

    public NewsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<NewsDto>> GetNewsAsync(int page, int pageSize)
    {
        var query = _dbContext.News.OrderByDescending(n => n.DateTimeUTC);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<NewsDto>(items.Select(MapNews).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<NewsDto?> GetNewsByIdAsync(int id)
    {
        var news = await _dbContext.News.FindAsync(id);
        return news is null ? null : MapNews(news);
    }

    private static NewsDto MapNews(News news)
    {
        return new NewsDto(
            news.Id,
            news.Headline,
            news.Summary,
            news.Content,
            news.ImageUrl,
            news.Source,
            news.DateTimeUTC
        );
    }
}
