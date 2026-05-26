using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoutesController : ControllerBase
{
    private readonly IRouteService _routeService;

    public RoutesController(IRouteService routeService)
    {
        _routeService = routeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoutes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _routeService.GetRoutesAsync(page, pageSize);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRouteById(int id)
    {
        var route = await _routeService.GetRouteByIdAsync(id);
        if (route is null)
        {
            return NotFound(new { Success = false, Message = "Route not found." });
        }

        return Ok(new { Success = true, Data = route });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateRoute(CreateRouteDto dto)
    {
        var route = await _routeService.CreateRouteAsync(dto);
        return Ok(new { Success = true, Data = route });
    }
}
