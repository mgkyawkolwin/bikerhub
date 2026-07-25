using System.Text.Json;
using BikerHub.Data;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BikerHub.Services;

public interface IGarageBikeService
{
    Task<IEnumerable<GarageBike>> GetGarageBikesAsync(Guid userId);
    Task<GarageBike?> GetGarageBikeByIdAsync(Guid id);
    Task<GarageBike> CreateGarageBikeAsync(GarageBike garageBike, Guid currentUserId);
    Task<GarageBike?> UpdateGarageBikeAsync(Guid id, GarageBike updatedGarageBike, Guid currentUserId);
    Task<GarageBike?> DeleteGarageBikeAsync(Guid id);
    Task<GarageBike?> UploadGarageBikeMediaAsync(Guid garageBikeId, IFormFile file, Guid currentUserId);
}

public class GarageBikeService : IGarageBikeService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService? _storageService;
    private readonly MinioSettings? _minioSettings;

    public GarageBikeService(AppDbContext dbContext, IStorageService? storageService = null, IOptions<MinioSettings>? minioOptions = null)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _minioSettings = minioOptions?.Value;
    }

    public async Task<IEnumerable<GarageBike>> GetGarageBikesAsync(Guid userId)
    {
        IQueryable<GarageBike> query = _dbContext.GarageBikes.AsNoTracking();

        query = query.Where(x => x.CreatedById == userId);

        return await query.OrderByDescending(x => x.CreatedAtUtc).ToListAsync();
    }

    public async Task<GarageBike?> GetGarageBikeByIdAsync(Guid id)
    {
        return await _dbContext.GarageBikes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<GarageBike> CreateGarageBikeAsync(GarageBike garageBike, Guid currentUserId)
    {
        garageBike.CreatedAtUtc = DateTime.UtcNow;
        garageBike.UpdatedAtUtc = DateTime.UtcNow;
        // garageBike.CreatedById = currentUserId;
        _dbContext.GarageBikes.Add(garageBike);
        await _dbContext.SaveChangesAsync();
        return garageBike;
    }

    public async Task<GarageBike?> UpdateGarageBikeAsync(Guid id, GarageBike updatedGarageBike, Guid currentUserId)
    {
        var garageBike = await _dbContext.GarageBikes.FirstOrDefaultAsync(x => x.Id == id);
        if (garageBike is null)
        {
            return null;
        }

        garageBike.Title = updatedGarageBike.Title;
        garageBike.Make = updatedGarageBike.Make;
        garageBike.Model = updatedGarageBike.Model;
        garageBike.Year = updatedGarageBike.Year;
        garageBike.Cc = updatedGarageBike.Cc;
        garageBike.Type = updatedGarageBike.Type;
        garageBike.ImagesJson = updatedGarageBike.ImagesJson;
        garageBike.Mileage = updatedGarageBike.Mileage;
        garageBike.Km = updatedGarageBike.Km;
        garageBike.Vin = updatedGarageBike.Vin;
        garageBike.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return garageBike;
    }

    public async Task<GarageBike?> DeleteGarageBikeAsync(Guid id)
    {
        var garageBike = await _dbContext.GarageBikes.FirstOrDefaultAsync(x => x.Id == id);
        if (garageBike is null)
        {
            return null;
        }

        _dbContext.GarageBikes.Remove(garageBike);
        await _dbContext.SaveChangesAsync();
        return garageBike;
    }

    public async Task<GarageBike?> UploadGarageBikeMediaAsync(Guid garageBikeId, IFormFile file, Guid currentUserId)
    {
        if (_storageService is null || _minioSettings is null)
        {
            throw new InvalidOperationException("Storage service is not configured.");
        }

        var garageBike = await _dbContext.GarageBikes.FindAsync(garageBikeId);
        if (garageBike is null)
        {
            throw new CustomException("Garage bike not found.");
        }

        var objectName = await _storageService.UploadFileAsync(file);
        var url = BuildObjectUrl(objectName);

        var images = string.IsNullOrWhiteSpace(garageBike.ImagesJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(garageBike.ImagesJson) ?? new List<string>();

        images.Add(url);
        garageBike.ImagesJson = JsonSerializer.Serialize(images);
        garageBike.UpdatedAtUtc = DateTime.UtcNow;
        // garageBike.UpdatedById = currentUserId;

        _dbContext.GarageBikes.Update(garageBike);
        await _dbContext.SaveChangesAsync();
        return garageBike;
    }

    private string BuildObjectUrl(string objectName)
    {
        if (_minioSettings is null)
        {
            throw new InvalidOperationException("Minio settings are not configured.");
        }

        if (string.IsNullOrWhiteSpace(_minioSettings.ObjectAccessUrl))
        {
            return objectName;
        }

        return $"{_minioSettings.ObjectAccessUrl}/{_minioSettings.BucketName}/{objectName}";
    }
}
