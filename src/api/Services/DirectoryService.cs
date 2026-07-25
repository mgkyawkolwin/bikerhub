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
    Task<PaginatedResultDto<DirectoryDto>> GetDirectoriesAsync(int page, int pageSize, string? query, string? businessType, string? city, string? stateDivision);
    Task<DirectoryDto?> GetDirectoryByIdAsync(Guid id);
    Task<DirectoryDto> CreateDirectoryAsync(CreateDirectoryDto dto);
    Task<DirectoryDto> UpdateDirectoryAsync(Guid directoryId, CreateDirectoryDto dto);
    Task DeleteDirectoryAsync(Guid directoryId, Guid currentUserId);
    Task<DirectoryDto> UploadDirectoryLogoAsync(Guid directoryId, IFormFile file);
    Task<DirectoryDto> UploadDirectoryCoverImageAsync(Guid directoryId, IFormFile file);
}

public class DirectoryService : IDirectoryService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<DirectoryService> _logger;
    private readonly IStorageService? _storageService;
    private readonly MinioSettings? _minioSettings;

    public DirectoryService(AppDbContext dbContext, ILogger<DirectoryService> logger, IStorageService? storageService = null, IOptions<MinioSettings>? minioOptions = null)
    {
        _dbContext = dbContext;
        _logger = logger;
        _storageService = storageService;
        _minioSettings = minioOptions?.Value;
    }

    public async Task<PaginatedResultDto<DirectoryDto>> GetDirectoriesAsync(int page, int pageSize, string? query, string? businessType, string? city, string? stateDivision)
    {
        _logger.LogInformation("CALLED GetDirectoriesAsync()");
        _logger.LogDebug(
            "GetDirectoriesAsync called with page {Page}, pageSize {PageSize}, query {Query}, businessType {BusinessType}, city {City}, stateDivision {StateDivision}",
            page, pageSize, query, businessType, city, stateDivision);

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
        _logger.LogTrace("Found {Total} directories matching filters", total);

        var items = await q.OrderByDescending(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        _logger.LogTrace("Returning {Count} directories from page {Page}", items.Count, page);
        _logger.LogTrace("Sample directory entry: {@Directory}", JsonSerializer.Serialize(items.FirstOrDefault()));
        _logger.LogTrace("Sample directory entry mapped to DTO: {@DirectoryDto}", new { Name = "hi hi", Age = 30 });

        return new PaginatedResultDto<DirectoryDto>(
            items.Select(MapDirectory).ToList(),
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize))
        );
    }

    public async Task<DirectoryDto?> GetDirectoryByIdAsync(Guid id)
    {
        _logger.LogInformation("CALLED GetDirectoryByIdAsync()");
        _logger.LogDebug("GetDirectoryByIdAsync called with id {Id}", id);

        var directory = await _dbContext.Directories.FindAsync(id);
        _logger.LogTrace("Found directory entry: {@Directory}", JsonSerializer.Serialize(directory));
        if (directory is null)
        {
            _logger.LogWarning("Directory entry not found for id {Id}", id);
            return null;
        }

        return MapDirectory(directory);
    }

    public async Task<DirectoryDto> CreateDirectoryAsync(CreateDirectoryDto dto)
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
            CreatedById = dto.UserId ?? Guid.Empty,
        };

        _dbContext.Directories.Add(entity);
        await _dbContext.SaveChangesAsync();

        _logger.LogTrace("Created directory entry with id {DirectoryId}", entity.Id);
        return MapDirectory(entity);
    }

    public async Task<DirectoryDto> UpdateDirectoryAsync(Guid directoryId, CreateDirectoryDto dto)
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

        if (dto.UserId is null || directory.CreatedById != dto.UserId.Value)
        {
            _logger.LogWarning("Not authorized to update directory entry {DirectoryId} by user {CurrentUserId}", directoryId, dto.UserId);
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

        directory.UpdatedById = dto.UserId.Value;
        directory.UpdatedAtUtc = DateTime.UtcNow;

        _dbContext.Directories.Update(directory);
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
        directory.LogoUrl = BuildObjectUrl(objectName);

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
        directory.CoverImageUrl = BuildObjectUrl(objectName);

        _dbContext.Directories.Update(directory);
        await _dbContext.SaveChangesAsync();

        return MapDirectory(directory);
    }

    private string BuildObjectUrl(string objectName)
    {
        if (_minioSettings is null)
        {
            return objectName;
        }

        var baseUrl = _minioSettings.ObjectAccessUrl?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return objectName;
        }

        return $"{baseUrl}/{_minioSettings.BucketName}/{objectName}";
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
            IsLiked = directory.IsLiked,
            LikesCount = directory.LikesCount,
            Rating = directory.Rating,
            RatingCount = directory.RatingCount,
            MyRating = directory.MyRating
        };
    }
}
