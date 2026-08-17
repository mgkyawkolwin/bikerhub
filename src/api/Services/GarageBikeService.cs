using System.Text.Json;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BikerHub.Api.Services;

public interface IGarageBikeService
{
    Task<IEnumerable<GarageBikeDto>> GetGarageBikesAsync(Guid userId);
    Task<GarageBikeDto?> GetGarageBikeByIdAsync(Guid id);
    Task<GarageBikeDto> CreateGarageBikeAsync(GarageBikeDto garageBike, Guid currentUserId);
    Task<GarageBikeDto?> UpdateGarageBikeAsync(Guid id, GarageBikeDto updatedGarageBike, Guid currentUserId);
    Task<GarageBikeDto?> DeleteGarageBikeAsync(Guid id, Guid currentUserId);
    Task<GarageBikeDto?> UploadGarageBikeMediaAsync(Guid garageBikeId, IFormFile file, Guid currentUserId);
    Task<bool> DeleteGarageBikeMediaAsync(Guid garageBikeId, Guid mediaId, Guid currentUserId);
}

public class GarageBikeService : IGarageBikeService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;

    public GarageBikeService(AppDbContext dbContext, IStorageService storageService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
    }

    public async Task<IEnumerable<GarageBikeDto>> GetGarageBikesAsync(Guid userId)
    {
        var garageBikes = await _dbContext.GarageBikes
            .AsNoTracking()
            .Where(x => x.CreatedById == userId)
            .ToListAsync();

        var garageBikeIds = garageBikes.Select(x => x.Id).ToList();
        var medias = await _dbContext.Medias.Where(m => garageBikeIds.Contains(m.OwnerId)).ToListAsync();
        var mediaLookup = medias.GroupBy(m => m.OwnerId).ToDictionary(g => g.Key, g => g.ToList());

        return [.. garageBikes.Select(garageBike => MapToDto(garageBike, mediaLookup.ContainsKey(garageBike.Id) ? mediaLookup[garageBike.Id] : null))];
    }

    public async Task<GarageBikeDto?> GetGarageBikeByIdAsync(Guid id)
    {
        var garageBike = await _dbContext.GarageBikes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        var medias = garageBike is null
            ? Enumerable.Empty<MediaEntity>()
            : await _dbContext.Medias.Where(m => m.OwnerId == garageBike.Id).ToListAsync();

        return MapToDto(garageBike, medias);
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

        var socialProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(x => x.UserId == currentUserId) ?? throw new CustomException("Social profile not found for the current user.");
        socialProfile.GarageCount += 1;

        // save make and model to lookup table if they don't exist
        var existingMake = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "MAKE" && x.Value == garageBike.Make);
        if (existingMake is null)
        {
            var newMake = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "MAKE",
                Code = garageBike.Make.ToUpperInvariant(),
                Value = garageBike.Make,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newMake);
        }
        var existingModel = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == garageBike.Make && x.Value == garageBike.Model);
        if (existingModel is null)
        {
            var newModel = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = garageBike.Make,
                Code = garageBike.Model.ToUpperInvariant(),
                Value = garageBike.Model,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newModel);
        }
        var existingType = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "BIKE_TYPE" && x.Value == garageBike.Type);
        if (existingType is null)
        {
            var newType = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "BIKE_TYPE",
                Code = garageBike.Type.ToUpperInvariant(),
                Value = garageBike.Type,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newType);
        }


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

        var existingMake = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "MAKE" && x.Value == garageBike.Make);
        if (existingMake is null)
        {
            var newMake = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "MAKE",
                Code = garageBike.Make.ToUpperInvariant(),
                Value = garageBike.Make,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newMake);
        }
        var existingModel = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == garageBike.Make && x.Value == garageBike.Model);
        if (existingModel is null)
        {
            var newModel = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = garageBike.Make,
                Code = garageBike.Model.ToUpperInvariant(),
                Value = garageBike.Model,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newModel);
        }
        var existingType = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "BIKE_TYPE" && x.Value == garageBike.Type);
        if (existingType is null)
        {
            var newType = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "BIKE_TYPE",
                Code = garageBike.Type.ToUpperInvariant(),
                Value = garageBike.Type,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newType);
        }

        await _dbContext.SaveChangesAsync();
        return MapToDto(garageBike);
    }

    public async Task<GarageBikeDto?> DeleteGarageBikeAsync(Guid id, Guid currentUserId)
    {
        var garageBike = await _dbContext.GarageBikes.FirstOrDefaultAsync(x => x.Id == id);
        if (garageBike is null)
        {
            return null;
        }
        _dbContext.GarageBikes.Remove(garageBike);
        var socialProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(x => x.UserId == currentUserId) ?? throw new CustomException("Social profile not found for the current user.");
        socialProfile.GarageCount -= 1;
        await _dbContext.SaveChangesAsync();
        return MapToDto(garageBike);
    }

    public async Task<GarageBikeDto?> UploadGarageBikeMediaAsync(Guid garageBikeId, IFormFile file, Guid currentUserId)
    {
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

    public async Task<bool> DeleteGarageBikeMediaAsync(Guid garageBikeId, Guid mediaId, Guid currentUserId)
    {
        var garageBike = await _dbContext.GarageBikes.FirstOrDefaultAsync(x => x.Id == garageBikeId);
        if (garageBike is null)
        {
            throw new CustomException("Garage bike not found.");
        }

        if (garageBike.CreatedById != currentUserId)
        {
            throw new CustomException("Not authorized to delete this media.");
        }

        var media = await _dbContext.Medias.FirstOrDefaultAsync(x => x.Id == mediaId && x.OwnerId == garageBike.Id);
        if (media is null)
        {
            throw new CustomException("Media not found.");
        }

        if (_storageService is not null)
        {
            try
            {
                await _storageService.DeleteObjectAsync(media.ObjectName);
            }
            catch (Exception ex)
            {
                // Best effort: continue to remove the DB record even if storage deletion fails.
                Console.WriteLine($"Failed to delete media object {media.ObjectName}: {ex.Message}");
            }
        }

        _dbContext.Medias.Remove(media);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private GarageBikeDto MapToDto(GarageBikeEntity? garageBike, IEnumerable<MediaEntity>? medias = null)
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
            Images = medias is null
                ? []
                : [.. medias.Select(image => new MediaDto
                {
                    Id = image.Id,
                    OwnerId = image.OwnerId,
                    ObjectName = image.ObjectName,
                    ContentType = image.ContentType,
                    Size = image.Size,
                    Url = _storageService.BuildObjectUrl(image.ObjectName),
                })]
        };
    }
}
