using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Exceptions;
using BikerHub.Services;
using System.Net;
using System.Text.Json;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RidesController : ControllerBase
{
    private readonly IRideService _rideService;
    private readonly ILogger<RidesController> _logger;

    public RidesController(IRideService rideService, ILogger<RidesController> logger)
    {
        _rideService = rideService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRides([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetRides(page={Page}, pageSize={PageSize})", page, pageSize);
            var result = await _rideService.GetRidesAsync(page, pageSize);
            _logger.LogDebug("Rides list returned: {Result}", JsonSerializer.Serialize(result));
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
    public async Task<IActionResult> GetRideById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetRideById({RideId})", id);
            var ride = await _rideService.GetRideByIdAsync(id);

            if (ride is null)
            {
                _logger.LogWarning("Ride not found for id {RideId}", id);
                return NotFound(new { Success = false, Message = "Ride not found." });
            }

            _logger.LogDebug("Ride found for id {RideId}: {Ride}", id, JsonSerializer.Serialize(ride));
            return Ok(new { Success = true, Data = ride });
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
    public async Task<IActionResult> CreateRide([FromBody] CreateRideDto? dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateRide()");
            _logger.LogDebug("CreateRideDto: {Dto}", JsonSerializer.Serialize(dto));
            if (dto is null)
            {
                _logger.LogWarning("CreateRide called with null body");
                return BadRequest(new { Success = false, Message = "CreateRideDto cannot be null." });
            }

            _logger.LogInformation("Creating ride {Name}", dto.Name);
            _logger.LogDebug("CreateRideDto: {Dto}", JsonSerializer.Serialize(dto));

            var ride = await _rideService.CreateRideAsync(dto);

            _logger.LogInformation("Ride created successfully: {Name}", dto.Name);
            _logger.LogDebug("Created ride result: {Ride}", JsonSerializer.Serialize(ride));
            return Ok(new { Success = true, Data = ride });
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
    public async Task<IActionResult> UpdateRide(Guid id, [FromBody] CreateRideDto? dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateRide({RideId})", id);
            _logger.LogDebug("UpdateRideDto: {Dto}", JsonSerializer.Serialize(dto));
            if (dto is null)
            {
                _logger.LogWarning("UpdateRide called with null body for id {RideId}", id);
                return BadRequest(new { Success = false, Message = "CreateRideDto cannot be null." });
            }

            _logger.LogInformation("Updating ride {RideId} {Name}", id, dto.Name);
            _logger.LogDebug("UpdateRideDto: {Dto}", JsonSerializer.Serialize(dto));

            var ride = await _rideService.UpdateRideAsync(id, dto);

            _logger.LogInformation("Ride updated successfully: {RideId}", id);
            _logger.LogDebug("Updated ride result: {Ride}", JsonSerializer.Serialize(ride));
            return Ok(new { Success = true, Data = ride });
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
