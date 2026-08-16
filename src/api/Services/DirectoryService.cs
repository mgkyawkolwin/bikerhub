using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Models;
using System.Text.Json;

namespace BikerHub.Services;

public interface IDirectoryService
{
    Task<PaginatedResultDto<DirectoryDto>> GetDirectoriesAsync(GetDirectoriesFilterDto filterDto, Guid currentUserId);
    Task<DirectoryDto?> GetDirectoryByIdAsync(Guid id, Guid currentUserId);
    Task<DirectoryDto> CreateDirectoryAsync(CreateDirectoryDto dto, Guid currentUserId);
    Task<DirectoryDto> UpdateDirectoryAsync(Guid directoryId, CreateDirectoryDto dto, Guid currentUserId);
    Task DeleteDirectoryAsync(Guid directoryId, Guid currentUserId);
    Task<DirectoryDto> UploadDirectoryLogoAsync(Guid directoryId, IFormFile file);
    Task<DirectoryDto> UploadDirectoryCoverImageAsync(Guid directoryId, IFormFile file);
    Task ToggleFavoriteAsync(Guid entityId, Guid currentUserId);
    Task<DirectoryDto?> SubmitRatingAsync(Guid entityId, Guid currentUserId, int rating);
}

public class DirectoryService : IDirectoryService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<DirectoryService> _logger;
    private readonly IStorageService? _storageService;

    public DirectoryService(AppDbContext dbContext, ILogger<DirectoryService> logger, IStorageService? storageService = null)
    {
        _dbContext = dbContext;
        _logger = logger;
        _storageService = storageService;
    }

    public async Task<PaginatedResultDto<DirectoryDto>> GetDirectoriesAsync(GetDirectoriesFilterDto filterDto, Guid currentUserId)
    {
        _logger.LogInformation("CALLED GetDirectoriesAsync()");
        _logger.LogDebug(
            "GetDirectoriesAsync called with filterDto {@FilterDto}",
            filterDto);

        filterDto = filterDto ?? new GetDirectoriesFilterDto();

        // 1. Start with the base entity queryable
        var baseQuery = _dbContext.Directories.AsNoTracking();

        // 2. Apply all conditional WHERE filters FIRST
        if (!string.IsNullOrWhiteSpace(filterDto.Query))
        {
            baseQuery = baseQuery.Where(d =>
                d.Name.Contains(filterDto.Query)
            );
        }

        if (!string.IsNullOrWhiteSpace(filterDto.BusinessType))
        {
            baseQuery = baseQuery.Where(d => d.BusinessType == filterDto.BusinessType);
        }

        if (!string.IsNullOrWhiteSpace(filterDto.City))
        {
            baseQuery = baseQuery.Where(d => d.City == filterDto.City);
        }

        if (!string.IsNullOrWhiteSpace(filterDto.StateDivision))
        {
            baseQuery = baseQuery.Where(d => d.State == filterDto.StateDivision);
        }

        // 3. Count total matching records BEFORE pagination
        var total = await baseQuery.CountAsync();
        _logger.LogTrace("Found {Total} directories matching filters", total);

        // 4. Order, Paginate, AND Project directly to DTO in a single SQL query
        var items = await baseQuery
            .OrderByDescending(d => d.Id)
            .Skip((filterDto.Page - 1) * filterDto.PageSize)
            .Take(filterDto.PageSize)
            .Select(d => new DirectoryDto
            {
                Id = d.Id,
                Name = d.Name,
                Address = d.Address,
                City = d.City,
                State = d.State,
                Country = d.Country,
                PostalCode = d.PostalCode,
                Phone = d.Phone,
                Email = d.Email,
                LogoUrl = d.LogoUrl,
                CoverImageUrl = d.CoverImageUrl,
                GoogleMapUrl = d.GoogleMapUrl,
                BusinessType = d.BusinessType,
                RatingCount = d.RatingCount,
                Rating = d.Rating,
                FavoriteCount = d.FavoriteCount,
                CreatedById = d.CreatedById,

                // Populated directly into DTO without needing [NotMapped] on Entity
                IsFavorited = _dbContext.Favorites
                    .Any(f => f.EntityId == d.Id && f.UserId == currentUserId),

                MyRating = _dbContext.Ratings
                    .Where(r => r.EntityId == d.Id && r.UserId == currentUserId)
                    .Select(r => (int?)r.Rating)
                    .FirstOrDefault()
            })
            .ToListAsync();

        _logger.LogTrace("Returning {Count} directories from page {Page}", items.Count, filterDto.Page);

        // 5. Return result (no MapDirectory step needed!)
        return new PaginatedResultDto<DirectoryDto>(
            items,
            filterDto.Page,
            filterDto.PageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)filterDto.PageSize))
        );
    }

    public async Task<DirectoryDto?> GetDirectoryByIdAsync(Guid id, Guid currentUserId)
    {
        _logger.LogInformation("CALLED GetDirectoryByIdAsync()");
        _logger.LogDebug("GetDirectoryByIdAsync called with id {Id}", id);

        var directory = await _dbContext.Directories.AsNoTracking()
            .Where(d => d.Id == id)
            .Select(d => new DirectoryDto
            {
                Id = d.Id,
                Name = d.Name,
                Address = d.Address,
                City = d.City,
                State = d.State,
                Country = d.Country,
                PostalCode = d.PostalCode,
                Phone = d.Phone,
                Email = d.Email,
                LogoUrl = d.LogoUrl,
                CoverImageUrl = d.CoverImageUrl,
                GoogleMapUrl = d.GoogleMapUrl,
                BusinessType = d.BusinessType,
                RatingCount = d.RatingCount,
                Rating = d.Rating,
                FavoriteCount = d.FavoriteCount,
                CreatedById = d.CreatedById,

                // Populated directly into DTO without needing [NotMapped] on Entity
                IsFavorited = _dbContext.Favorites
                    .Any(f => f.EntityId == d.Id && f.UserId == currentUserId),

                MyRating = _dbContext.Ratings
                    .Where(r => r.EntityId == d.Id && r.UserId == currentUserId)
                    .Select(r => (int?)r.Rating)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();
        _logger.LogTrace("Found directory entry: {@Directory}", JsonSerializer.Serialize(directory));
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {Id}", id);
            return null;
        }

        return directory;
    }

    public async Task<DirectoryDto> CreateDirectoryAsync(CreateDirectoryDto dto, Guid currentUserId)
    {
        _logger.LogInformation("CALLED CreateDirectoryAsync()");
        _logger.LogDebug("CreateDirectoryAsync called with dto {@Dto}", dto);

        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var entity = new DirectoryEntity
        {
            Name = dto.Name,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            Country = dto.Country,
            PostalCode = dto.PostalCode,
            Phone = dto.Phone,
            Email = dto.Email,
            LogoUrl = dto.LogoUrl,
            CoverImageUrl = dto.CoverImageUrl,
            GoogleMapUrl = dto.GoogleMapUrl,
            BusinessType = dto.BusinessType,
            CreatedById = currentUserId,
        };

        _dbContext.Directories.Add(entity);

        var existingBusinessType = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "BUSINESS TYPE" && x.Value == dto.BusinessType);
        if (existingBusinessType is null)
        {
            var newBusinessType = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "BUSINESS TYPE",
                Code = dto.BusinessType!.ToUpperInvariant(),
                Value = dto.BusinessType,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newBusinessType);
        }

        var existingCity = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "CITY" && x.Value == dto.City);
        if (existingCity is null)
        {
            var newCity = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "CITY",
                Code = dto.City!.ToUpperInvariant(),
                Value = dto.City,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newCity);
        }
        var existingStateDivision = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "STATE DIVISION" && x.Value == dto.State);
        if (existingStateDivision is null)
        {
            var newStateDivision = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "STATE DIVISION",
                Code = dto.State!.ToUpperInvariant(),
                Value = dto.State,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newStateDivision);
        }

        var existingCountry = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "COUNTRY" && x.Value == dto.Country);
        if (existingCountry is null)
        {
            var newCountry = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "COUNTRY",
                Code = dto.Country!.ToUpperInvariant(),
                Value = dto.Country,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newCountry);
        }


        await _dbContext.SaveChangesAsync();

        _logger.LogTrace("Created directory entry with id {DirectoryId}", entity.Id);
        return MapDirectory(entity);
    }

    public async Task<DirectoryDto> UpdateDirectoryAsync(Guid directoryId, CreateDirectoryDto dto, Guid currentUserId)
    {
        _logger.LogInformation("CALLED UpdateDirectoryAsync()");
        _logger.LogDebug("UpdateDirectoryAsync called with directoryId {DirectoryId} and dto {@Dto}", directoryId, dto);

        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var directory = await _dbContext.Directories.FindAsync(directoryId);
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {DirectoryId}", directoryId);
            throw new CustomException("Directory entry not found.");
        }

        if (directory.CreatedById != currentUserId)
        {
            _logger.LogWarning("Not authorized to update directory entry {DirectoryId} by user {CurrentUserId}", directoryId, currentUserId);
            throw new CustomException("Not authorized to update this directory entry.");
        }

        directory.Name = dto.Name;
        directory.Address = dto.Address;
        directory.City = dto.City;
        directory.State = dto.State;
        directory.Country = dto.Country;
        directory.PostalCode = dto.PostalCode;
        directory.Phone = dto.Phone;
        directory.Email = dto.Email;
        directory.GoogleMapUrl = dto.GoogleMapUrl;
        directory.BusinessType = dto.BusinessType;

        if (dto.LogoUrl is not null)
        {
            directory.LogoUrl = dto.LogoUrl;
        }

        if (dto.CoverImageUrl is not null)
        {
            directory.CoverImageUrl = dto.CoverImageUrl;
        }

        directory.UpdatedById = currentUserId;
        directory.UpdatedAtUtc = DateTime.UtcNow;

        _dbContext.Directories.Update(directory);

        var existingBusinessType = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "BUSINESS TYPE" && x.Value == dto.BusinessType);
        if (existingBusinessType is null)
        {
            var newBusinessType = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "BUSINESS TYPE",
                Code = dto.BusinessType!.ToUpperInvariant(),
                Value = dto.BusinessType,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newBusinessType);
        }

        var existingCity = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "CITY" && x.Value == dto.City);
        if (existingCity is null)
        {
            var newCity = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "CITY",
                Code = dto.City!.ToUpperInvariant(),
                Value = dto.City,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newCity);
        }
        var existingStateDivision = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "STATE DIVISION" && x.Value == dto.State);
        if (existingStateDivision is null)
        {
            var newStateDivision = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "STATE DIVISION",
                Code = dto.State!.ToUpperInvariant(),
                Value = dto.State,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newStateDivision);
        }

        var existingCountry = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "COUNTRY" && x.Value == dto.Country);
        if (existingCountry is null)
        {
            var newCountry = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "COUNTRY",
                Code = dto.Country!.ToUpperInvariant(),
                Value = dto.Country,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newCountry);
        }

        await _dbContext.SaveChangesAsync();

        return MapDirectory(directory);
    }

    public async Task DeleteDirectoryAsync(Guid directoryId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED DeleteDirectoryAsync()");
        _logger.LogDebug("DeleteDirectoryAsync called with directoryId {DirectoryId} and currentUserId {CurrentUserId}", directoryId, currentUserId);

        var directory = await _dbContext.Directories.FindAsync(directoryId);
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {DirectoryId}", directoryId);
            throw new CustomException("Directory entry not found.");
        }

        if (directory.CreatedById != currentUserId)
        {
            _logger.LogWarning("Not authorized to delete directory entry {DirectoryId} by user {CurrentUserId}", directoryId, currentUserId);
            throw new CustomException("Not authorized to delete this directory entry.");
        }

        _dbContext.Directories.Remove(directory);
        await _dbContext.SaveChangesAsync();
    }

    public async Task ToggleFavoriteAsync(Guid entityId, Guid currentUserId)
    {
        _logger.LogInformation("CALLED ToggleFavoriteAsync()");
        _logger.LogDebug("ToggleFavoriteAsync called with entityId {EntityId} and currentUserId {CurrentUserId}", entityId, currentUserId);

        var directory = await _dbContext.Directories.FindAsync(entityId);
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {EntityId}", entityId);
            throw new CustomException("Directory entry not found.");
        }

        var favorite = await _dbContext.Favorites
            .FirstOrDefaultAsync(f => f.EntityId == entityId && f.UserId == currentUserId);

        if (favorite is null)
        {
            favorite = new FavoriteEntity
            {
                Id = Guid.NewGuid(),
                EntityId = entityId,
                UserId = currentUserId,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };

            _dbContext.Favorites.Add(favorite);
            directory.FavoriteCount += 1;
        }
        else
        {
            _dbContext.Favorites.Remove(favorite);
            directory.FavoriteCount = Math.Max(0, directory.FavoriteCount - 1);
        }

        directory.UpdatedAtUtc = DateTime.UtcNow;
        directory.UpdatedById = currentUserId;

        _dbContext.Directories.Update(directory);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<DirectoryDto?> SubmitRatingAsync(Guid entityId, Guid currentUserId, int rating)
    {
        _logger.LogInformation("CALLED SubmitRatingAsync()");
        _logger.LogDebug("SubmitRatingAsync called with entityId {EntityId}, rating {Rating} and currentUserId {CurrentUserId}", entityId, rating, currentUserId);

        var directory = await _dbContext.Directories.FindAsync(entityId);
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {EntityId}", entityId);
            return null;
        }

        var existingRating = await _dbContext.Ratings
            .FirstOrDefaultAsync(r => r.EntityId == entityId && r.UserId == currentUserId);

        if (existingRating is null)
        {
            existingRating = new RatingEntity
            {
                Id = Guid.NewGuid(),
                EntityId = entityId,
                UserId = currentUserId,
                Rating = rating,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.Ratings.Add(existingRating);
            var ratingCount = (directory.RatingCount ?? 0) + 1;
            directory.RatingCount = ratingCount;
            directory.Rating = directory.Rating.HasValue
                ? ((directory.Rating.Value * (ratingCount - 1) + rating) / ratingCount)
                : rating;
        }
        else
        {
            var totalRating = (directory.Rating ?? 0) * (directory.RatingCount ?? 1);
            totalRating = totalRating - existingRating.Rating + rating;
            existingRating.Rating = rating;
            existingRating.UpdatedAtUtc = DateTime.UtcNow;
            existingRating.UpdatedById = currentUserId;
            _dbContext.Ratings.Update(existingRating);
            directory.Rating = directory.RatingCount.HasValue && directory.RatingCount.Value > 0
                ? totalRating / directory.RatingCount.Value
                : rating;
        }

        directory.UpdatedAtUtc = DateTime.UtcNow;
        directory.UpdatedById = currentUserId;

        _dbContext.Directories.Update(directory);
        await _dbContext.SaveChangesAsync();

        return MapDirectory(directory);
    }

    public async Task<DirectoryDto> UploadDirectoryLogoAsync(Guid directoryId, IFormFile file)
    {
        _logger.LogInformation("CALLED UploadDirectoryLogoAsync()");
        if (_storageService is null)
        {
            _logger.LogWarning("Storage service is not configured for upload");
            throw new InvalidOperationException("Storage service not configured.");
        }

        var directory = await _dbContext.Directories.FindAsync(directoryId);
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {DirectoryId}", directoryId);
            throw new Exception("Directory entry not found.");
        }

        var objectName = await _storageService.UploadFileAsync(file);
        directory.LogoUrl = _storageService.BuildObjectUrl(objectName);

        _dbContext.Directories.Update(directory);
        await _dbContext.SaveChangesAsync();

        return MapDirectory(directory);
    }

    public async Task<DirectoryDto> UploadDirectoryCoverImageAsync(Guid directoryId, IFormFile file)
    {
        _logger.LogInformation("CALLED UploadDirectoryCoverImageAsync()");
        if (_storageService is null)
        {
            _logger.LogWarning("Storage service is not configured for upload");
            throw new InvalidOperationException("Storage service not configured.");
        }

        var directory = await _dbContext.Directories.FindAsync(directoryId);
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {DirectoryId}", directoryId);
            throw new Exception("Directory entry not found.");
        }

        var objectName = await _storageService.UploadFileAsync(file);
        directory.CoverImageUrl = _storageService.BuildObjectUrl(objectName);

        _dbContext.Directories.Update(directory);
        await _dbContext.SaveChangesAsync();

        return MapDirectory(directory);
    }

    private static DirectoryDto MapDirectory(DirectoryEntity directory)
    {
        return new DirectoryDto
        {
            Id = directory.Id,
            Name = directory.Name,
            Address = directory.Address,
            City = directory.City,
            State = directory.State,
            Country = directory.Country,
            PostalCode = directory.PostalCode,
            Phone = directory.Phone,
            Email = directory.Email,
            LogoUrl = directory.LogoUrl,
            CoverImageUrl = directory.CoverImageUrl,
            GoogleMapUrl = directory.GoogleMapUrl,
            BusinessType = directory.BusinessType,
            CreatedById = directory.CreatedById,
            IsFavorited = directory.IsFavorited,
            FavoriteCount = directory.FavoriteCount,
            Rating = directory.Rating,
            RatingCount = directory.RatingCount,
            MyRating = directory.MyRating
        };
    }
}
