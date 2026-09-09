using System.Net;
using System.Text.Json;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BikerHub.Api.Controllers;

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
            var createdGarageBike = await _garageBikeService.CreateGarageBikeAsync(garageBike);
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
            var garageBike = await _garageBikeService.UpdateGarageBikeAsync(id, updatedGarageBike);
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

            var garageBike = await _garageBikeService.UploadGarageBikeMediaAsync(id, file);
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
            await _garageBikeService.DeleteGarageBikeMediaAsync(id, mediaId);
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

    [HttpGet("{id:guid}/service-history")]
    [Authorize]
    public async Task<IActionResult> GetGarageBikeServiceHistory(Guid id)
    {
        try
        {
            var history = await _garageBikeService.GetServiceHistoryAsync(id);
            return Ok(new { Success = true, Data = history });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching service history.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/service-history")]
    [Authorize]
    public async Task<IActionResult> CreateGarageBikeServiceHistory(Guid id, [FromBody] GarageBikeServiceHistoryDto historyDto)
    {
        try
        {
            var result = await _garageBikeService.CreateServiceHistoryAsync(id, historyDto);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while creating service history.", Details = ex.Message });
        }
    }

    [HttpPut("{id:guid}/service-history/{historyId:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateGarageBikeServiceHistory(Guid id, Guid historyId, [FromBody] GarageBikeServiceHistoryDto historyDto)
    {
        try
        {
            var result = await _garageBikeService.UpdateServiceHistoryAsync(id, historyId, historyDto);
            if (result is null)
            {
                return NotFound(new { Success = false, Message = "Service history not found." });
            }

            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while updating service history.", Details = ex.Message });
        }
    }
}
