using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using RouteEntity = BikerHub.Entities.Route;

namespace BikerHub.Services;

public interface IRouteService
{
    Task<PaginatedResultDto<RouteDto>> GetRoutesAsync(int page, int pageSize);
    Task<RouteDto?> GetRouteByIdAsync(int id);
    Task<RouteDto> CreateRouteAsync(CreateRouteDto dto);
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
        var query = _dbContext.Routes.OrderByDescending(r => r.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<RouteDto>(items.Select(MapRoute).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<RouteDto?> GetRouteByIdAsync(int id)
    {
        var route = await _dbContext.Routes.FindAsync(id);
        return route is null ? null : MapRoute(route);
    }

    public async Task<RouteDto> CreateRouteAsync(CreateRouteDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Name, "Name");

        var entity = new RouteEntity
        {
            Name = dto.Name,
            Description = dto.Description,
            Distance = dto.Distance,
            Duration = dto.Duration,
            Type = dto.Type,
            CreatedById = dto.CreatedById,
            CreatedByName = dto.CreatedByName,
            GpxUrl = dto.GpxUrl,
            LocationsJson = dto.Locations is null ? null : JsonSerializer.Serialize(dto.Locations),
            RoutePathJson = dto.RoutePath is null ? null : JsonSerializer.Serialize(dto.RoutePath),
            OsrmResponseJson = dto.OsrmResponseJson,
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Routes.Add(entity);
        await _dbContext.SaveChangesAsync();
        return MapRoute(entity);
    }

    private static RouteDto MapRoute(RouteEntity route)
    {
        var locations = string.IsNullOrWhiteSpace(route.LocationsJson)
            ? Enumerable.Empty<RouteLocationDto>()
            : JsonSerializer.Deserialize<IEnumerable<RouteLocationDto>>(route.LocationsJson) ?? Enumerable.Empty<RouteLocationDto>();

        var routePath = string.IsNullOrWhiteSpace(route.RoutePathJson)
            ? Enumerable.Empty<RouteLocationDto>()
            : JsonSerializer.Deserialize<IEnumerable<RouteLocationDto>>(route.RoutePathJson) ?? Enumerable.Empty<RouteLocationDto>();

        return new RouteDto(
            route.Id,
            route.Name,
            route.Description,
            route.Distance,
            route.Duration,
            route.Type,
            route.CreatedById,
            route.CreatedByName,
            route.GpxUrl,
            locations,
            routePath,
            route.OsrmResponseJson,
            route.CreatedAt
        );
    }
}
