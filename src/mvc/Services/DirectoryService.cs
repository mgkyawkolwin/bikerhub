using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using DirectoryEntity = BikerHub.Entities.Directory;

namespace BikerHub.Services;

public interface IDirectoryService
{
    Task<PaginatedResultDto<DirectoryDto>> GetDirectoriesAsync(int page, int pageSize, string? query, string? businessType, string? city, string? stateDivision);
    Task<DirectoryDto?> GetDirectoryByIdAsync(int id);
    Task<DirectoryDto> CreateDirectoryAsync(CreateDirectoryDto dto);
}

public class DirectoryService : IDirectoryService
{
    private readonly AppDbContext _dbContext;

    public DirectoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<DirectoryDto>> GetDirectoriesAsync(int page, int pageSize, string? query, string? businessType, string? city, string? stateDivision)
    {
        var q = _dbContext.Directories.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            q = q.Where(item => item.Name.Contains(query) || item.Address.Contains(query) || item.BusinessType.Contains(query));
        }

        if (!string.IsNullOrWhiteSpace(businessType))
        {
            q = q.Where(item => item.BusinessType == businessType);
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            q = q.Where(item => item.City == city);
        }

        if (!string.IsNullOrWhiteSpace(stateDivision))
        {
            q = q.Where(item => item.State == stateDivision);
        }

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResultDto<DirectoryDto>(
            items.Select(MapDirectory).ToList(),
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize))
        );
    }

    public async Task<DirectoryDto?> GetDirectoryByIdAsync(int id)
    {
        var directory = await _dbContext.Directories.FindAsync(id);
        return directory is null ? null : MapDirectory(directory);
    }

    public async Task<DirectoryDto> CreateDirectoryAsync(CreateDirectoryDto dto)
    {
        var entity = new DirectoryEntity
        {
            Name = dto.Name,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            Phone = dto.Phone,
            LogoUrl = dto.LogoUrl,
            CoverImageUrl = dto.CoverImageUrl,
            BusinessType = dto.BusinessType,
            CreatedById = null,
        };

        _dbContext.Directories.Add(entity);
        await _dbContext.SaveChangesAsync();
        return MapDirectory(entity);
    }

    private static DirectoryDto MapDirectory(DirectoryEntity directory)
    {
        return new DirectoryDto(
            directory.Id,
            directory.Name,
            directory.Address,
            directory.City,
            directory.State,
            directory.Phone,
            directory.LogoUrl,
            directory.CoverImageUrl,
            directory.BusinessType,
            directory.CreatedById,
            directory.IsLiked,
            directory.LikesCount,
            directory.Rating,
            directory.RatingCount,
            directory.MyRating
        );
    }
}
