using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Services;

using BikerHub.Api.Exceptions;

public interface ILookUpService
{
    Task<IEnumerable<LookUpDto>> GetLookUpsAsync(string? category, string? code, string? value);
    Task<IEnumerable<LookUpDto>> GetLookUpsByCategoryAsync(string category);
    Task<LookUpDto> CreateLookUpAsync(LookUpDto dto);
    Task<LookUpDto> UpdateLookUpAsync(Guid id, LookUpDto dto);
    Task DeleteLookUpAsync(Guid id);
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

    public async Task<LookUpDto> CreateLookUpAsync(LookUpDto dto)
    {
        _logger.LogInformation("CALLED CreateLookUpAsync()");

        if (dto is null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            throw new CustomException("Category is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Value))
        {
            throw new CustomException("Value is required.");
        }

        var category = dto.Category.Trim();
        var value = dto.Value.Trim();
        var code = dto.Code?.Trim() ?? value.ToUpperInvariant();

        var existing = await _dbContext.Set<LookUpEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Category == category && item.Value == value);

        if (existing is not null)
        {
            throw new CustomException($"The value '{value}' already exists in category '{category}'.");
        }

        var entity = new LookUpEntity
        {
            Category = category,
            Code = code,
            Value = value,
        };

        _dbContext.Set<LookUpEntity>().Add(entity);
        await _dbContext.SaveChangesAsync();

        return new LookUpDto
        {
            Id = entity.Id,
            Category = entity.Category,
            Code = entity.Code,
            Value = entity.Value,
        };
    }

    public async Task<LookUpDto> UpdateLookUpAsync(Guid id, LookUpDto dto)
    {
        _logger.LogInformation("CALLED UpdateLookUpAsync()");

        if (dto is null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            throw new CustomException("Category is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Value))
        {
            throw new CustomException("Value is required.");
        }

        var category = dto.Category.Trim();
        var value = dto.Value.Trim();
        var code = dto.Code?.Trim() ?? value.ToUpperInvariant();

        var entity = await _dbContext.Set<LookUpEntity>().FirstOrDefaultAsync(item => item.Id == id);
        if (entity is null)
        {
            throw new CustomException("Lookup item not found.");
        }

        var duplicate = await _dbContext.Set<LookUpEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Category == category && item.Value == value && item.Id != id);

        if (duplicate is not null)
        {
            throw new CustomException($"The value '{value}' already exists in category '{category}'.");
        }

        entity.Code = code;
        entity.Value = value;
        entity.Category = category;

        _dbContext.Set<LookUpEntity>().Update(entity);
        await _dbContext.SaveChangesAsync();

        return new LookUpDto
        {
            Id = entity.Id,
            Category = entity.Category,
            Code = entity.Code,
            Value = entity.Value,
        };
    }

    public async Task DeleteLookUpAsync(Guid id)
    {
        _logger.LogInformation("CALLED DeleteLookUpAsync()");

        var entity = await _dbContext.Set<LookUpEntity>().FirstOrDefaultAsync(item => item.Id == id);
        if (entity is null)
        {
            throw new CustomException("Lookup item not found.");
        }

        _dbContext.Set<LookUpEntity>().Remove(entity);
        await _dbContext.SaveChangesAsync();
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
