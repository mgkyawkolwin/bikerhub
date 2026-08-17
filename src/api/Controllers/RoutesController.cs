using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;
using System.Net;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoutesController : BaseController
{
    private readonly IRouteService _routeService;
    private readonly ILogger<RoutesController> _logger;

    public RoutesController(IRouteService routeService, ILogger<RoutesController> logger) : base(logger)
    {
        _routeService = routeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoutes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetRoutes(page={Page}, pageSize={PageSize})", page, pageSize);
            var result = await _routeService.GetRoutesAsync(page, pageSize);
            _logger.LogDebug("Routes list returned: {Result}", JsonSerializer.Serialize(result));
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRouteById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetRouteById({RouteId})", id);
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
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoute([FromBody]CreateRouteDto? dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateRoute()");
            _logger.LogDebug("CreateRouteDto: {Dto}", JsonSerializer.Serialize(dto));
            if (dto is null)
            {
                _logger.LogWarning("CreateRoute called with null body");
                return BadRequest(new { Success = false, Message = "CreateRouteDto cannot be null." });
            }

            var rawBody = await new StreamReader(Request.Body).ReadToEndAsync();
            _logger.LogError("RAW REQUEST BODY: {RawBody}", rawBody);
            _logger.LogInformation("Creating route {Name}", dto.Name);
            _logger.LogDebug("CreateRouteDto: {Dto}", JsonSerializer.Serialize(dto));

            var route = await _routeService.CreateRouteAsync(dto);

            _logger.LogInformation("Route created successfully: {Name}", dto.Name);
            _logger.LogDebug("Created route result: {Route}", JsonSerializer.Serialize(route));
            return Ok(new { Success = true, Data = route });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoute(Guid id, [FromBody]CreateRouteDto? dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateRoute({RouteId})", id);
            _logger.LogDebug("UpdateRouteDto: {Dto}", JsonSerializer.Serialize(dto));
            if (dto is null)
            {
                _logger.LogWarning("UpdateRoute called with null body for id {RouteId}", id);
                return BadRequest(new { Success = false, Message = "CreateRouteDto cannot be null." });
            }

            _logger.LogInformation("Updating route {RouteId} {Name}", id, dto.Name);
            _logger.LogDebug("UpdateRouteDto: {Dto}", JsonSerializer.Serialize(dto));

            var route = await _routeService.UpdateRouteAsync(id, dto);

            _logger.LogInformation("Route updated successfully: {RouteId}", id);
            _logger.LogDebug("Updated route result: {Route}", JsonSerializer.Serialize(route));
            return Ok(new { Success = true, Data = route });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
