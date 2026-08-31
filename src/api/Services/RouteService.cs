using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Net.Http;
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
    Task<string> CalculateRouteAsync(CalculateRouteDto dto);
}

public class RouteService : IRouteService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<RouteService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpClientFactory _httpClientFactory;

    public RouteService(AppDbContext dbContext, ILogger<RouteService> logger, ICurrentUserService currentUserService, IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _logger = logger;
        _currentUserService = currentUserService;
        _httpClientFactory = httpClientFactory;
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

    public async Task<string> CalculateRouteAsync(CalculateRouteDto dto)
    {
        if (dto.Waypoints is null)
        {
            throw new CustomException("Waypoints cannot be null.");
        }

        var waypoints = dto.Waypoints.ToList();
        if (waypoints.Count < 2)
        {
            throw new CustomException("At least two waypoints are required to calculate a route.");
        }

        var coordinates = string.Join(';', waypoints.Select(wp => $"{wp.Longitude},{wp.Latitude}"));
        var url = $"https://router.project-osrm.org/route/v1/driving/{coordinates}?overview=full&geometries=geojson";

        using var httpClient = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("BikerHub/1.0 (+https://yourapp.example.com)");

        using var response = await httpClient.SendAsync(request);
        _logger.LogDebug("OSRM API response status: {StatusCode} {StatusMessage}", response.StatusCode, response.ReasonPhrase);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(content);
        if (!json.RootElement.TryGetProperty("code", out var codeElement) || codeElement.GetString() != "Ok")
        {
            throw new CustomException("Unable to generate route from the provided waypoints.");
        }

        return content;
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
            CreatedAtUtc = route.CreatedAtUtc
        };
    }
}
