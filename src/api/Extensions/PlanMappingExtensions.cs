using System.Text.Json;
using System.Text;
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
                   Riders = dbContext.Set<PlanRiderEntity>()
                       .Where(r => r.PlanId == plan.Id)
                       .Select(r => new PlanRiderDto
                       {
                           UserId = r.UserId,
                           Confirmed = r.Confirmed,
                           DisplayName = dbContext.Users
                               .Where(u => u.Id == r.UserId)
                               .Select(u => u.DisplayName)
                               .FirstOrDefault() ?? "Rider",
                           ProfilePictureUrl = dbContext.SocialProfiles
                               .Where(s => s.UserId == r.UserId)
                               .Select(s => s.ProfilePhotoUrl)
                               .FirstOrDefault() ?? dbContext.Users
                               .Where(u => u.Id == r.UserId)
                               .Select(u => u.ProfilePictureUrl)
                               .FirstOrDefault()
                       })
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

            // try to deserialize points (case-insensitive to match client JSON keys like "latitude")
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var waypoints = pointsElement.Deserialize<List<RouteLocationDto>>(options) ?? new List<RouteLocationDto>();

            // attempt to find OSRM route geometry and encode it as a polyline (preferred for accurate path rendering)
            string? encodedPolyline = null;
            if (document.RootElement.TryGetProperty("route", out var routeElement))
            {
                try
                {
                    // navigate to routes[0].geometry.coordinates
                    if (routeElement.TryGetProperty("routes", out var routesEl) && routesEl.ValueKind == JsonValueKind.Array && routesEl.GetArrayLength() > 0)
                    {
                        var firstRoute = routesEl[0];
                        if (firstRoute.TryGetProperty("geometry", out var geometryEl) && geometryEl.ValueKind == JsonValueKind.Object)
                        {
                            if (geometryEl.TryGetProperty("coordinates", out var coordsEl) && coordsEl.ValueKind == JsonValueKind.Array)
                            {
                                var coords = new List<RouteLocationDto>();
                                foreach (var coordEl in coordsEl.EnumerateArray())
                                {
                                    if (coordEl.ValueKind == JsonValueKind.Array && coordEl.GetArrayLength() >= 2)
                                    {
                                        // OSRM returns [lon, lat]
                                        var lon = coordEl[0].GetDouble();
                                        var lat = coordEl[1].GetDouble();
                                        coords.Add(new RouteLocationDto(lat, lon));
                                    }
                                }

                                if (coords.Count > 0)
                                {
                                    // keep any explicit waypoints for markers, but prefer encoded polyline for the path
                                    encodedPolyline = EncodePolyline(coords);
                                    // if we didn't deserialize explicit points earlier, use the route coords as markers as well
                                    if (waypoints.Count == 0)
                                    {
                                        waypoints = coords;
                                    }
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // ignore and fall through to return null below if still empty
                }
            }

            if (waypoints is null || waypoints.Count == 0)
            {
                return null;
            }

            return googleMapsService.GetStaticMapUrl(new RouteStaticMapDto(waypoints, 640, 320, 2, encodedPolyline));
        }
        catch
        {
            return null;
        }
    }

    // Encodes a list of lat/lng points to a Google encoded polyline string
    private static string EncodePolyline(List<RouteLocationDto> points)
    {
        var result = new StringBuilder();
        var prevLat = 0;
        var prevLng = 0;

        foreach (var pt in points)
        {
            var lat = (int)Math.Round(pt.Latitude * 1e5);
            var lng = (int)Math.Round(pt.Longitude * 1e5);
            var dLat = lat - prevLat;
            var dLng = lng - prevLng;
            EncodeSignedNumber(dLat, result);
            EncodeSignedNumber(dLng, result);
            prevLat = lat;
            prevLng = lng;
        }

        return result.ToString();
    }

    private static void EncodeSignedNumber(int num, StringBuilder sb)
    {
        num <<= 1;
        if (num < 0)
        {
            num = ~num;
        }

        while (num >= 0x20)
        {
            sb.Append((char)(((num & 0x1f) | 0x20) + 63));
            num >>= 5;
        }

        sb.Append((char)(num + 63));
    }
}
