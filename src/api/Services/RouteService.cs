using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

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
    private readonly ILogger<RouteService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public RouteService(AppDbContext dbContext, ILogger<RouteService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<RouteDto>> GetRoutesAsync(int page, int pageSize)
    {
        var query = _dbContext.Routes.OrderByDescending(r => r.CreatedAtUtc);
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
            OsrmResponseJson = dto.OsrmResponseJson,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
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
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        entity.OsrmResponseJson = dto.OsrmResponseJson;

        await _dbContext.SaveChangesAsync();
        return MapRoute(entity);
    }

    private static RouteDto MapRoute(RouteEntity route)
    {
        return new RouteDto{
            Name = route.Name,
            Description = route.Description,
            Distance = route.Distance,
            Duration = route.Duration,
            OsrmResponseJson = route.OsrmResponseJson,
            CreatedById = route.CreatedById,
            CreatedAtUTC = route.CreatedAtUtc
        };
    }
}
