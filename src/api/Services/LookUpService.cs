using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Services;

public interface ILookUpService
{
    Task<IEnumerable<LookUpDto>> GetLookUpsAsync(string? category, string? code, string? value);
    Task<IEnumerable<LookUpDto>> GetLookUpsByCategoryAsync(string category);
}

public class LookUpService : ILookUpService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<LookUpService> _logger;

    public LookUpService(AppDbContext dbContext, ILogger<LookUpService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IEnumerable<LookUpDto>> GetLookUpsAsync(string? category, string? code, string? value)
    {
        _logger.LogInformation("CALLED GetLookUpsAsync()");
        _logger.LogDebug("GetLookUpsAsync called with category {Category} and code {Code} and value {Value}", category, code, value);

        var query = _dbContext.Set<LookUpEntity>()
        .AsNoTracking();

        // Apply filters only if values are provided
        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(item => item.Category == category);
        }

        if (!string.IsNullOrEmpty(code))
        {
            query = query.Where(item => item.Code.Contains(code));
        }

        if (!string.IsNullOrEmpty(value))
        {
            query = query.Where(item => item.Value.Contains(value));
        }

        var items = await query
            .OrderBy(item => item.Code)
            .Select(item => new LookUpDto
            {
                Id = item.Id,
                Category = item.Category,
                Code = item.Code,
                Value = item.Value,
            })
            .ToListAsync();

        _logger.LogTrace("Found {Count} lookups for category {Category} and value {Value}", items.Count, category, value);
        return items;
    }

    public async Task<IEnumerable<LookUpDto>> GetLookUpsByCategoryAsync(string category)
    {
        _logger.LogInformation("CALLED GetLookUpsByCategoryAsync()");
        _logger.LogDebug("GetLookUpsByCategoryAsync called with category {Category}", category);

        var items = await _dbContext.Set<LookUpEntity>()
            .AsNoTracking()
            .Where(item => item.Category == category)
            .OrderBy(item => item.Code)
            .Select(item => new LookUpDto
            {
                Id = item.Id,
                Category = item.Category,
                Code = item.Code,
                Value = item.Value,
            })
            .ToListAsync();

        _logger.LogTrace("Found {Count} lookups for category {Category}", items.Count, category);
        return items;
    }
}
