using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface ILookUpService
{
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
