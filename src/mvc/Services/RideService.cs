using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using RideEntity = BikerHub.Entities.RideEntity;

namespace BikerHub.Services;

public interface IRideService
{
    Task<PaginatedResultDto<RideDto>> GetRidesAsync(int page, int pageSize);
    Task<RideDto?> GetRideByIdAsync(Guid id);
    Task<RideDto> CreateRideAsync(CreateRideDto dto);
    Task<RideDto> UpdateRideAsync(Guid id, CreateRideDto dto);
}

public class RideService : IRideService
{
    private readonly AppDbContext _dbContext;

    public RideService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<RideDto>> GetRidesAsync(int page, int pageSize)
    {
        var query = _dbContext.Rides.OrderByDescending(r => r.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<RideDto>(items.Select(MapRide).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<RideDto?> GetRideByIdAsync(Guid id)
    {
        var ride = await _dbContext.Rides.FindAsync(id);
        return ride is null ? null : MapRide(ride);
    }

    public async Task<RideDto> CreateRideAsync(CreateRideDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var entity = new RideEntity
        {
            Name = dto.Name ?? string.Empty,
            Description = dto.Description,
            Distance = dto.Distance,
            Duration = dto.Duration,
            CreatedById = dto.CreatedById,
            LocationsJson = dto.Locations is null ? null : JsonSerializer.Serialize(dto.Locations),
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Rides.Add(entity);
        await _dbContext.SaveChangesAsync();
        return MapRide(entity);
    }

    public async Task<RideDto> UpdateRideAsync(Guid id, CreateRideDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var entity = await _dbContext.Rides.FindAsync(id);
        if (entity is null)
        {
            throw new CustomException("Ride not found.");
        }

        entity.Name = dto.Name ?? entity.Name;
        entity.Description = dto.Description;
        entity.Distance = dto.Distance;
        entity.Duration = dto.Duration;
        entity.CreatedById = dto.CreatedById;
        entity.LocationsJson = dto.Locations is null ? null : JsonSerializer.Serialize(dto.Locations);

        await _dbContext.SaveChangesAsync();
        return MapRide(entity);
    }

    private static RideDto MapRide(RideEntity ride)
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

        return new RideDto(
            ride.Id,
            ride.Name,
            ride.Description,
            ride.Distance,
            ride.Duration,
            ride.CreatedById,
            locations,
            ride.CreatedAt
        );
    }
}
