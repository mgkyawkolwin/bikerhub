using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Exceptions;
using BikerHub.Services;
using System.Net;
using System.Text.Json;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoutesController : ControllerBase
{
    private readonly IRouteService _routeService;
    private readonly ILogger<RoutesController> _logger;

    public RoutesController(IRouteService routeService, ILogger<RoutesController> logger)
    {
        _routeService = routeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoutes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogInformation("Fetching routes list: page={Page}, pageSize={PageSize}", page, pageSize);
            var result = await _routeService.GetRoutesAsync(page, pageSize);
            _logger.LogDebug("Routes list returned: {Result}", JsonSerializer.Serialize(result));
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Failed to fetch routes list: page={Page}, pageSize={PageSize}", page, pageSize);
            return StatusCode((int)HttpStatusCode.BadRequest, new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching routes list");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching routes." });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRouteById(int id)
    {
        try
        {
            _logger.LogInformation("Fetching route by id {RouteId}", id);
            var route = await _routeService.GetRouteByIdAsync(id);

            if (route is null)
            {
                _logger.LogWarning("Route not found for id {RouteId}", id);
                return NotFound(new { Success = false, Message = "Route not found." });
            }

            _logger.LogDebug("Route found for id {RouteId}: {Route}", id, JsonSerializer.Serialize(route));
            return Ok(new { Success = true, Data = route });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Failed to fetch route by id {RouteId}", id);
            return StatusCode((int)HttpStatusCode.BadRequest, new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching route by id {RouteId}", id);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching the route." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoute(CreateRouteDto dto)
    {
        try
        {
            _logger.LogInformation("Creating route {Name}", dto.Name);
            _logger.LogDebug("CreateRouteDto: {Dto}", JsonSerializer.Serialize(dto));

            var route = await _routeService.CreateRouteAsync(dto);

            _logger.LogInformation("Route created successfully: {Name}", dto.Name);
            _logger.LogDebug("Created route result: {Route}", JsonSerializer.Serialize(route));
            return Ok(new { Success = true, Data = route });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Failed to create route {Name}", dto.Name);
            return StatusCode((int)HttpStatusCode.BadRequest, new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while creating route {Name}", dto.Name);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while creating the route." });
        }
    }
}
