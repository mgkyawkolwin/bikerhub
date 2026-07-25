using System.Text.Json;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BikerHub.Services;

public interface IGarageBikeService
{
    Task<IEnumerable<GarageBikeDto>> GetGarageBikesAsync(Guid userId);
    Task<GarageBikeDto?> GetGarageBikeByIdAsync(Guid id);
    Task<GarageBikeDto> CreateGarageBikeAsync(GarageBikeDto garageBike, Guid currentUserId);
    Task<GarageBikeDto?> UpdateGarageBikeAsync(Guid id, GarageBikeDto updatedGarageBike, Guid currentUserId);
    Task<GarageBikeDto?> DeleteGarageBikeAsync(Guid id);
    Task<GarageBikeDto?> UploadGarageBikeMediaAsync(Guid garageBikeId, IFormFile file, Guid currentUserId);
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

    public async Task<IEnumerable<GarageBikeDto>> GetGarageBikesAsync(Guid userId)
    {
        IQueryable<GarageBikeEntity> query = _dbContext.GarageBikes.Include(bike => bike.Images).AsNoTracking();
        query = query.Where(x => x.CreatedById == userId);
        var garageBikes = await query.ToListAsync();
        return [.. garageBikes.Select(MapToDto)];
    }

    public async Task<GarageBikeDto?> GetGarageBikeByIdAsync(Guid id)
    {
        return MapToDto(await _dbContext.GarageBikes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id));
    }

    public async Task<GarageBikeDto> CreateGarageBikeAsync(GarageBikeDto garageBike, Guid currentUserId)
    {
        var garageBikeEntity = new GarageBikeEntity
        {
            Id = garageBike.Id != Guid.Empty ? garageBike.Id : Guid.NewGuid(),
            Make = garageBike.Make,
            Model = garageBike.Model,
            Year = garageBike.Year,
            Cc = garageBike.Cc,
            Type = garageBike.Type,
            Km = garageBike.Km,
            Vin = garageBike.Vin,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };
        _dbContext.GarageBikes.Add(garageBikeEntity);
        await _dbContext.SaveChangesAsync();
        return MapToDto(garageBikeEntity);
    }

    public async Task<GarageBikeDto?> UpdateGarageBikeAsync(Guid id, GarageBikeDto updatedGarageBike, Guid currentUserId)
    {
        var garageBike = await _dbContext.GarageBikes.FirstOrDefaultAsync(x => x.Id == id);
        if (garageBike is null)
        {
            return null;
        }

        garageBike.Make = updatedGarageBike.Make;
        garageBike.Model = updatedGarageBike.Model;
        garageBike.Year = updatedGarageBike.Year;
        garageBike.Cc = updatedGarageBike.Cc;
        garageBike.Type = updatedGarageBike.Type;
        garageBike.Km = updatedGarageBike.Km;
        garageBike.Vin = updatedGarageBike.Vin;
        garageBike.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return MapToDto(garageBike);
    }

    public async Task<GarageBikeDto?> DeleteGarageBikeAsync(Guid id)
    {
        var garageBike = await _dbContext.GarageBikes.FirstOrDefaultAsync(x => x.Id == id);
        if (garageBike is null)
        {
            return null;
        }

        _dbContext.GarageBikes.Remove(garageBike);
        await _dbContext.SaveChangesAsync();
        return MapToDto(garageBike);
    }

    public async Task<GarageBikeDto?> UploadGarageBikeMediaAsync(Guid garageBikeId, IFormFile file, Guid currentUserId)
    {
        if (_storageService is null || _minioSettings is null)
        {
            throw new InvalidOperationException("Storage service is not configured.");
        }

        var garageBike = await _dbContext.GarageBikes.FindAsync(garageBikeId) ?? throw new CustomException("Garage bike not found.");
        var objectName = await _storageService.UploadFileAsync(file);

        var media = new MediaEntity
        {
            OwnerId = garageBike.Id,
            ObjectName = objectName,
            ContentType = file.ContentType,
            Size = file.Length,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };
        _dbContext.Medias.Add(media);
        await _dbContext.SaveChangesAsync();
        return MapToDto(garageBike);
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

    private GarageBikeDto MapToDto(GarageBikeEntity? garageBike)
    {
        if (garageBike is null)
        {
            return null!;
        }
        return new GarageBikeDto
        {
            Id = garageBike.Id,
            Make = garageBike.Make,
            Model = garageBike.Model,
            Year = garageBike.Year,
            Cc = garageBike.Cc,
            Type = garageBike.Type,
            Km = garageBike.Km,
            Vin = garageBike.Vin,
            CreatedById = garageBike.CreatedById,
            Images = [.. garageBike.Images.Select(image => new MediaDto
            {
                Id = image.Id,
                OwnerId = image.OwnerId,
                ObjectName = image.ObjectName,
                ContentType = image.ContentType,
                Size = image.Size,
                Url = BuildObjectUrl(image.ObjectName),
            })]
        };
    }
}
