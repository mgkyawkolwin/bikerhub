using System.Net;
using System.Text.Json;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/garagebikes")]
public class GarageBikesController : BaseController
{
    private readonly IGarageBikeService _garageBikeService;
    private readonly ILogger<GarageBikesController> _logger;

    public GarageBikesController(IGarageBikeService garageBikeService, ILogger<GarageBikesController> logger) : base(logger)
    {
        _garageBikeService = garageBikeService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetGarageBikes([FromQuery] Guid userId)
    {
        try
        {
            _logger.LogDebug("CALLED: GetGarageBikes(userId={UserId})", userId);
            var garageBikes = await _garageBikeService.GetGarageBikesAsync(userId);
            _logger.LogTrace("Bikes Count: {Count}", garageBikes.Count());
            _logger.LogTrace("Sample Data: {Data}", JsonSerializer.Serialize(garageBikes.FirstOrDefault()));
            return Ok(new { Success = true, Data = garageBikes });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching garage bikes.", Details = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetGarageBikeById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetGarageBikeById({GarageBikeId})", id);
            var garageBike = await _garageBikeService.GetGarageBikeByIdAsync(id);
            _logger.LogDebug("Garage Bike Data: {Data}", JsonSerializer.Serialize(garageBike));
            if (garageBike is null)
            {
                return NotFound(new { Success = false, Message = "Garage bike not found." });
            }

            return Ok(new { Success = true, Data = garageBike });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching the garage bike.", Details = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateGarageBike([FromBody] GarageBikeDto garageBike)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateGarageBike({GarageBike})", JsonSerializer.Serialize(garageBike));
            var createdGarageBike = await _garageBikeService.CreateGarageBikeAsync(garageBike, GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user."));
            return Ok(new { Success = true, Data = createdGarageBike });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while creating the garage bike.", Details = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateGarageBike(Guid id, [FromBody] GarageBikeDto updatedGarageBike)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateGarageBike({GarageBikeId})", id);
            var garageBike = await _garageBikeService.UpdateGarageBikeAsync(id, updatedGarageBike, GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user."));
            if (garageBike is null)
            {
                return NotFound(new { Success = false, Message = "Garage bike not found." });
            }

            return Ok(new { Success = true, Data = garageBike });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while updating the garage bike.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/media")]
    [Authorize]
    public async Task<IActionResult> UploadGarageBikeMedia([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadGarageBikeMedia(id={GarageBikeId}, file={File})", id, JsonSerializer.Serialize(file));
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A media file is required." });
            }

            var garageBike = await _garageBikeService.UploadGarageBikeMediaAsync(id, file, GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user."));
            return Ok(new { Success = true, Data = garageBike });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while uploading garage bike media.", Details = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteGarageBike(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteGarageBike({GarageBikeId})", id);
            var garageBike = await _garageBikeService.DeleteGarageBikeAsync(id);
            if (garageBike is null)
            {
                return NotFound(new { Success = false, Message = "Garage bike not found." });
            }

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
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while deleting the garage bike.", Details = ex.Message });
        }
    }

    [HttpDelete("{id:guid}/media/{mediaId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteGarageBikeMedia(Guid id, Guid mediaId)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteGarageBikeMedia({GarageBikeId}, {MediaId})", id, mediaId);
            await _garageBikeService.DeleteGarageBikeMediaAsync(id, mediaId, GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user."));
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
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while deleting the garage bike media.", Details = ex.Message });
        }
    }
}
