using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BikerHub.Dtos;
using BikerHub.Exceptions;
using BikerHub.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DirectoriesController : ControllerBase
{
    private readonly IDirectoryService _directoryService;
    private readonly ILogger<DirectoriesController> _logger;

    public DirectoriesController(IDirectoryService directoryService, ILogger<DirectoriesController> logger)
    {
        _directoryService = directoryService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetDirectories([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? query = null, [FromQuery] string? businessType = null, [FromQuery] string? city = null, [FromQuery] string? stateDivision = null)
    {
        try
        {
            _logger.LogInformation("CALLED GetDirectories()");
            _logger.LogDebug(
                "GetDirectories called with page {Page}, pageSize {PageSize}, query {Query}, businessType {BusinessType}, city {City}, stateDivision {StateDivision}",
                page, pageSize, query, businessType, city, stateDivision);

            var result = await _directoryService.GetDirectoriesAsync(page, pageSize, query, businessType, city, stateDivision);
            return Ok(new { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetDirectories");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDirectoryById(Guid id)
    {
        try
        {
            _logger.LogInformation("CALLED GetDirectoryById()");
            _logger.LogDebug("GetDirectoryById called with id {Id}", id);

            var directory = await _directoryService.GetDirectoryByIdAsync(id);
            if (directory is null)
            {
                _logger.LogWarning("Directory entry not found for id {Id}", id);
                return NotFound(new { Success = false, Message = "Directory entry not found." });
            }

            return Ok(new { Success = true, Data = directory });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetDirectoryById");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateDirectory(CreateDirectoryDto dto)
    {
        try
        {
            _logger.LogInformation("CALLED CreateDirectory()");
            _logger.LogDebug("CreateDirectory called with dto {@Dto}", dto);
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null)
            {
                _logger.LogWarning("Unauthorized attempt to create directory");
                return Unauthorized(new { Success = false, Message = "User is not authenticated." });
            }
            dto.UserId = currentUserId.Value;
            var directory = await _directoryService.CreateDirectoryAsync(dto);
            return Ok(new { Success = true, Data = directory });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in CreateDirectory");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in CreateDirectory");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateDirectory([FromRoute] Guid id, [FromBody] CreateDirectoryDto dto)
    {
        try
        {
            _logger.LogInformation("CALLED UpdateDirectory()");
            _logger.LogDebug("UpdateDirectory called with id {Id} and dto {@Dto}", id, dto);
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null)
            {
                _logger.LogWarning("Unauthorized attempt to update directory");
                return Unauthorized(new { Success = false, Message = "User is not authenticated." });
            }
            if (dto is null)
            {
                return BadRequest(new { Success = false, Message = "Request body cannot be null." });
            }

            dto.UserId = currentUserId.Value;
            var directory = await _directoryService.UpdateDirectoryAsync(id, dto);
            return Ok(new { Success = true, Data = directory });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in UpdateDirectory");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in UpdateDirectory");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteDirectory([FromRoute] Guid id)
    {
        try
        {
            _logger.LogInformation("CALLED DeleteDirectory()");
            _logger.LogDebug("DeleteDirectory called with id {Id}", id);
            var currentUserId = GetCurrentUserId();
            if (currentUserId is null)
            {
                _logger.LogWarning("Unauthorized attempt to delete directory");
                return Unauthorized(new { Success = false, Message = "User is not authenticated." });
            }

            await _directoryService.DeleteDirectoryAsync(id, currentUserId.Value);
            return Ok(new { Success = true });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in DeleteDirectory");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in DeleteDirectory");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("{id:guid}/logo")]
    [Authorize]
    public async Task<IActionResult> UploadDirectoryLogo([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogInformation("CALLED UploadDirectoryLogo()");
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A logo file is required." });
            }

            var directory = await _directoryService.UploadDirectoryLogoAsync(id, file);
            return Ok(new { Success = true, Data = directory });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in UploadDirectoryLogo");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in UploadDirectoryLogo");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("{id:guid}/cover-image")]
    [Authorize]
    public async Task<IActionResult> UploadDirectoryCoverImage([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogInformation("CALLED UploadDirectoryCoverImage()");
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A cover image file is required." });
            }

            var directory = await _directoryService.UploadDirectoryCoverImageAsync(id, file);
            return Ok(new { Success = true, Data = directory });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning(ex, "Custom exception occurred in UploadDirectoryCoverImage");
            return BadRequest(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in UploadDirectoryCoverImage");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
    private Guid? GetCurrentUserId()
    {
        var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(userId, out var parsed) ? parsed : null;
    }
}
