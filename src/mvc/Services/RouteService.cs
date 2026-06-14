using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;

namespace BikerHub.Services;

public interface IRouteService
{
    Task<PaginatedResultDto<RouteDto>> GetRoutesAsync(int page, int pageSize);
    Task<RouteDto?> GetRouteByIdAsync(Guid id);
    Task<RouteDto> CreateRouteAsync(CreateRouteDto dto);
    Task<RouteDto> UpdateRouteAsync(Guid id, CreateRouteDto dto);
}

public class RouteService : IRouteService
{
    private readonly AppDbContext _dbContext;

    public RouteService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<RouteDto>> GetRoutesAsync(int page, int pageSize)
    {
        var query = _dbContext.Routes.OrderByDescending(r => r.CreatedAtUTC);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<RouteDto>(items.Select(MapRoute).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<RouteDto?> GetRouteByIdAsync(Guid id)
    {
        var route = await _dbContext.Routes.FindAsync(id);
        return route is null ? null : MapRoute(route);
    }

    public async Task<RouteDto> CreateRouteAsync(CreateRouteDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var entity = new RouteEntity
        {
            Name = dto.Name ?? string.Empty,
            Description = dto.Description,
            Distance = dto.Distance,
            Duration = dto.Duration,
            CreatedById = dto.CreatedById,
            OsrmResponseJson = dto.OsrmResponseJson,
            CreatedAtUTC = DateTime.UtcNow,
        };

        _dbContext.Routes.Add(entity);
        await _dbContext.SaveChangesAsync();
        return MapRoute(entity);
    }

    public async Task<RouteDto> UpdateRouteAsync(Guid id, CreateRouteDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var entity = await _dbContext.Routes.FindAsync(id);
        if (entity is null)
        {
            throw new CustomException("Route not found.");
        }

        entity.Name = dto.Name ?? entity.Name;
        entity.Description = dto.Description;
        entity.Distance = dto.Distance;
        entity.Duration = dto.Duration;
        entity.CreatedById = dto.CreatedById;
        entity.OsrmResponseJson = dto.OsrmResponseJson;

        await _dbContext.SaveChangesAsync();
        return MapRoute(entity);
    }

    private static RouteDto MapRoute(RouteEntity route)
    {
        return new RouteDto{
            Id = route.Id,
            Name = route.Name,
            Description = route.Description,
            Distance = route.Distance,
            Duration = route.Duration,
            OsrmResponseJson = route.OsrmResponseJson,
            CreatedById = route.CreatedById,
            CreatedAtUTC = route.CreatedAtUTC
        };
    }
}
