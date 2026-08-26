using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using BikerHub.Api.Models;

namespace BikerHub.Api.Services;

public interface IRideService
{
    Task<PaginatedResultDto<RideDto>> GetRidesAsync(int page, int pageSize);
    Task<RideDto?> GetRideByIdAsync(Guid id);
    Task<RideDto> CreateRideAsync(CreateRideDto dto);
    Task<RideDto> UpdateRideAsync(Guid id, CreateRideDto dto);
    Task<RideDto> UpdateRideInfoAsync(Guid id, UpdateRideInfoDto dto);
    Task<RideDto> UploadRideMediaAsync(Guid rideId, IFormFile file);
    Task<bool> DeleteRideMediaAsync(Guid rideId, Guid mediaId);
}

public class RideService : IRideService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<RideService> _logger;

    public RideService(AppDbContext dbContext, IStorageService storageService, ICurrentUserService currentUserService, ILogger<RideService> logger)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<RideDto>> GetRidesAsync(int page, int pageSize)
    {
        var query = _dbContext.Rides.OrderByDescending(r => r.CreatedAtUtc);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        // load medias for these rides in a single query
        var rideIds = items.Select(i => i.Id).ToList();
        var medias = await _dbContext.Medias.Where(m => rideIds.Contains(m.OwnerId)).ToListAsync();
        var mediaLookup = medias.GroupBy(m => m.OwnerId).ToDictionary(g => g.Key, g => g.ToList());

        var mapped = items.Select(item => MapRide(item, mediaLookup.ContainsKey(item.Id) ? mediaLookup[item.Id] : null)).ToList();
        return new PaginatedResultDto<RideDto>(mapped, page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<RideDto?> GetRideByIdAsync(Guid id)
    {
        var ride = await _dbContext.Rides.FindAsync(id);
        if (ride is null) return null;
        var medias = await _dbContext.Medias.Where(m => m.OwnerId == ride.Id).ToListAsync();
        return MapRide(ride, medias);
    }

    public async Task<RideDto> CreateRideAsync(CreateRideDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");
        DtoValidationHelper.ValidateGuid(dto.CreatedById, "CreatedById");
        if (dto.Locations is null || !dto.Locations.Any())
        {
            throw new CustomException("Locations are required.");
        }

        var entity = new RideEntity
        {
            Name = dto.Name ?? string.Empty,
            Description = dto.Description,
            Bike = dto.Bike,
            Distance = dto.Distance,
            Duration = dto.Duration,
            AverageSpeed = dto.AverageSpeed,
            TotalElevation = dto.TotalElevation,
            MinSpeed = dto.MinSpeed,
            MaxSpeed = dto.MaxSpeed,
            MinElevation = dto.MinElevation,
            MaxElevation = dto.MaxElevation,
            LocationsJson = JsonSerializer.Serialize(dto.Locations),
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };

        _dbContext.Rides.Add(entity);
        await _dbContext.SaveChangesAsync();
        var medias = await _dbContext.Medias.Where(m => m.OwnerId == entity.Id).ToListAsync();
        return MapRide(entity, medias);
    }

    public async Task<RideDto> UpdateRideAsync(Guid id, CreateRideDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");
        DtoValidationHelper.ValidateGuid(dto.CreatedById, "CreatedById");
        
        if (dto.Locations is null || !dto.Locations.Any())
        {
            throw new CustomException("Locations are required.");
        }

        var entity = await _dbContext.Rides.FindAsync(id);
        if (entity is null)
        {
            throw new CustomException("Ride not found.");
        }

        entity.Name = dto.Name ?? entity.Name;
        entity.Bike = dto.Bike;
        entity.Description = dto.Description;
        entity.Distance = dto.Distance;
        entity.Duration = dto.Duration;
        entity.AverageSpeed = dto.AverageSpeed;
        entity.TotalElevation = dto.TotalElevation;
        entity.MinSpeed = dto.MinSpeed;
        entity.MaxSpeed = dto.MaxSpeed;
        entity.MinElevation = dto.MinElevation;
        entity.MaxElevation = dto.MaxElevation;
        entity.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.LocationsJson = JsonSerializer.Serialize(dto.Locations);

        await _dbContext.SaveChangesAsync();
        var medias = await _dbContext.Medias.Where(m => m.OwnerId == entity.Id).ToListAsync();
        return MapRide(entity, medias);
    }

    public async Task<RideDto> UpdateRideInfoAsync(Guid id, UpdateRideInfoDto dto)
    {
        if (dto is null)
        {
            throw new CustomException("UpdateRideInfoDto cannot be null.");
        }

        var entity = await _dbContext.Rides.FindAsync(id);
        if (entity is null)
        {
            throw new CustomException("Ride not found.");
        }

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            entity.Name = dto.Name;
        }

        // update bike and description (description can be cleared)
        entity.Name = dto.Name ?? "";
        entity.Bike = dto.Bike;
        entity.Description = dto.Description;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedById = Guid.Parse(_currentUserService.UserId!);

        await _dbContext.SaveChangesAsync();
        var medias = await _dbContext.Medias.Where(m => m.OwnerId == entity.Id).ToListAsync();
        return MapRide(entity, medias);
    }
    private RideDto MapRide(RideEntity ride, IEnumerable<MediaEntity>? medias = null)
    {
        IEnumerable<RideLocationDto>? locations = null;

        if (!string.IsNullOrWhiteSpace(ride.LocationsJson))
        {
            try
            {
                locations = JsonSerializer.Deserialize<IEnumerable<RideLocationDto>>(ride.LocationsJson);
            }
            catch
            {
                locations = null;
            }
        }

        List<MediaDto>? mediaDtos = null;
        if (medias != null && medias.Any())
        {
            mediaDtos = medias.Select(m => new MediaDto
            {
                Id = m.Id,
                OwnerId = m.OwnerId,
                ObjectName = m.ObjectName,
                ContentType = m.ContentType,
                Size = m.Size,
                Url = _storageService.BuildObjectUrl(m.ObjectName)
            }).ToList();
        }

        return new RideDto(
            ride.Id,
            ride.Name,
            ride.Description,
            ride.Bike,
            ride.Distance,
            ride.Duration,
            ride.AverageSpeed,
            ride.TotalElevation,
            ride.MinSpeed,
            ride.MaxSpeed,
            ride.MinElevation,
            ride.MaxElevation,
            ride.CreatedById,
            locations,
            mediaDtos,
            ride.CreatedAtUtc,
            ride.UpdatedAtUtc,
            ride.UpdatedById
        );
    }

    public async Task<RideDto> UploadRideMediaAsync(Guid rideId, IFormFile file)
    {
        var ride = await _dbContext.Rides.FindAsync(rideId) ?? throw new CustomException("Ride not found.");
        var objectName = await _storageService.UploadFileAsync(file);

        var media = new MediaEntity
        {
            OwnerId = ride.Id,
            ObjectName = objectName,
            ContentType = file.ContentType ?? "application/octet-stream",
            Size = file.Length,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };
        _dbContext.Medias.Add(media);
        await _dbContext.SaveChangesAsync();

        var medias = await _dbContext.Medias.Where(m => m.OwnerId == ride.Id).ToListAsync();
        return MapRide(ride, medias);
    }

    public async Task<bool> DeleteRideMediaAsync(Guid rideId, Guid mediaId)
    {
        var ride = await _dbContext.Rides.FirstOrDefaultAsync(x => x.Id == rideId);
        if (ride is null)
        {
            throw new CustomException("Ride not found.");
        }

        if (ride.CreatedById != Guid.Parse(_currentUserService.UserId!))
        {
            throw new CustomException("Not authorized to delete this media.");
        }

        var media = await _dbContext.Medias.FirstOrDefaultAsync(x => x.Id == mediaId && x.OwnerId == ride.Id);
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
            catch (Exception)
            {
                // Best effort
            }
        }

        _dbContext.Medias.Remove(media);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
