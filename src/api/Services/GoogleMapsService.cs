using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using BikerHub.Api.Dtos;
using BikerHub.Api.Models;

namespace BikerHub.Api.Services;

public interface IGoogleMapsService
{
    string GetStaticMapUrl(RouteStaticMapDto request);
}

public class GoogleMapsService : IGoogleMapsService
{
    private readonly GoogleMapsSettings _googleMapsSettings;

    public GoogleMapsService(GoogleMapsSettings googleMapsSettings)
    {
        _googleMapsSettings = googleMapsSettings;
    }

    public string GetStaticMapUrl(RouteStaticMapDto request)
    {
        const string baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
        var waypoints = request.Waypoints?.ToList() ?? new List<RouteLocationDto>();

        if (!waypoints.Any() && string.IsNullOrWhiteSpace(request.EncodedPolyline))
        {
            throw new InvalidOperationException("At least one waypoint or encoded route polyline is required to build a static map URL.");
        }

        var width = Math.Clamp(request.Width, 1, 640);
        var height = Math.Clamp(request.Height, 1, 640);
        var scale = Math.Clamp(request.Scale, 1, 2);

        var path = string.Join("|", waypoints.Select(w => $"{w.Latitude.ToString(CultureInfo.InvariantCulture)},{w.Longitude.ToString(CultureInfo.InvariantCulture)}"));
        var encodedPolyline = request.EncodedPolyline?.Trim();
        var pathValue = !string.IsNullOrWhiteSpace(encodedPolyline)
            ? $"color:0x4285f4|weight:4|enc:{encodedPolyline}"
            : $"color:0x4285f4|weight:4|{path}";

        var markers = string.Join("&", waypoints.Select((w, index) =>
        {
            var label = index == 0 ? "S" : index == waypoints.Count - 1 ? "E" : "";
            var color = index == 0 ? "green" : index == waypoints.Count - 1 ? "red" : "blue";
            var labelSegment = string.IsNullOrEmpty(label) ? string.Empty : $"label:{label}|";
            return $"markers=color:{color}|{labelSegment}{w.Latitude.ToString(CultureInfo.InvariantCulture)},{w.Longitude.ToString(CultureInfo.InvariantCulture)}";
        }));

        var parameters = new List<string>
        {
            $"size={width}x{height}",
            $"scale={scale}",
            $"path={Uri.EscapeDataString(pathValue)}",
        };

        if (!string.IsNullOrWhiteSpace(markers))
        {
            parameters.Add(markers);
        }

        var apiKey = _googleMapsSettings.ApiKey?.Trim();
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            parameters.Add($"key={Uri.EscapeDataString(apiKey)}");
        }

        return $"{baseUrl}?{string.Join("&", parameters)}";
    }
}
