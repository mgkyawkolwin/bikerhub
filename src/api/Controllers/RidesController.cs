using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using BikerHub.Api.Dtos;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;
using System.Net;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RidesController : BaseController
{
    private readonly IRideService _rideService;
    private readonly ILogger<RidesController> _logger;

    public RidesController(IRideService rideService, ILogger<RidesController> logger) : base(logger)
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

    [HttpPost("{id:guid}/media")]
    [Authorize]
    public async Task<IActionResult> UploadRideMedia([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadRideMedia(id={RideId}, file={File})", id, JsonSerializer.Serialize(file));
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A media file is required." });
            }

            var ride = await _rideService.UploadRideMediaAsync(id, file, GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user."));
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

    [HttpDelete("{id:guid}/media/{mediaId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteRideMedia([FromRoute] Guid id, [FromRoute] Guid mediaId)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteRideMedia({RideId}, {MediaId})", id, mediaId);
            await _rideService.DeleteRideMediaAsync(id, mediaId, GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user."));
            return Ok(new { Success = true });
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

    [HttpPatch("{id}/info")]
    public async Task<IActionResult> UpdateRideInfo(Guid id, [FromBody] UpdateRideInfoDto? dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateRideInfo({RideId})", id);
            if (dto is null)
            {
                _logger.LogWarning("UpdateRideInfo called with null body for id {RideId}", id);
                return BadRequest(new { Success = false, Message = "UpdateRideInfoDto cannot be null." });
            }

            _logger.LogInformation("Updating ride info {RideId} {Name}", id, dto.Name);
            var ride = await _rideService.UpdateRideInfoAsync(id, dto);

            _logger.LogInformation("Ride info updated successfully: {RideId}", id);
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
