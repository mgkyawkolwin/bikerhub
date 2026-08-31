using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Services;

namespace BikerHub.Api.Extensions;

public static class PlanMappingExtensions
{
    public static IQueryable<PlanDto> ProjectToDto(
        this IQueryable<PlanEntity> baseQuery,
        AppDbContext dbContext,
        IGoogleMapsService googleMapsService)
    {
        return from plan in baseQuery
               select new PlanDto
               {
                   Id = plan.Id,
                   Title = plan.Title,
                   Description = plan.Description,
                   Distance = plan.Distance,
                   Duration = plan.Duration,
                   Elevation = plan.Elevation,
                   TripDateTimeUtc = plan.TripDateTimeUtc,
                   LocationsJson = plan.LocationsJson,
                   StaticMapUrl = BuildStaticMapUrl(plan.LocationsJson, googleMapsService),
                   RiderIds = dbContext.Set<PlanRiderEntity>()
                       .Where(r => r.PlanId == plan.Id)
                       .Select(r => r.UserId)
                       .ToList(),
                   ConfirmedCount = dbContext.Set<PlanRiderEntity>()
                       .Count(r => r.PlanId == plan.Id && r.Confirmed),
                   MaybeCount = dbContext.Set<PlanRiderEntity>()
                       .Count(r => r.PlanId == plan.Id && !r.Confirmed),
                   CreatedAtUTC = plan.CreatedAtUtc,
                   CreatedById = plan.CreatedById,
                   UpdatedAtUTC = plan.UpdatedAtUtc,
                   UpdatedById = plan.UpdatedById
               };
    }

    private static string? BuildStaticMapUrl(string? locationsJson, IGoogleMapsService googleMapsService)
    {
        if (string.IsNullOrWhiteSpace(locationsJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(locationsJson);
            if (!document.RootElement.TryGetProperty("points", out var pointsElement) || pointsElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var waypoints = pointsElement.Deserialize<List<RouteLocationDto>>();
            if (waypoints is null || waypoints.Count == 0)
            {
                return null;
            }

            return googleMapsService.GetStaticMapUrl(new RouteStaticMapDto(waypoints, 640, 320, 2));
        }
        catch
        {
            return null;
        }
    }
}
