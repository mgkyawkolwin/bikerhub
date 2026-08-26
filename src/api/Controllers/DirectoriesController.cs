using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BikerHub.Api.Dtos;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DirectoriesController : BaseController
{
    private readonly IDirectoryService _directoryService;
    private readonly ILogger<DirectoriesController> _logger;

    public DirectoriesController(IDirectoryService directoryService, ILogger<DirectoriesController> logger) : base(logger)
    {
        _directoryService = directoryService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetDirectories([FromQuery] GetDirectoriesFilterDto filterDto)
    {
        try
        {
            _logger.LogDebug("CALLED: GetDirectories(filterDto={@FilterDto})", JsonSerializer.Serialize(filterDto));

            filterDto = filterDto ?? new GetDirectoriesFilterDto();
            var result = await _directoryService.GetDirectoriesAsync(filterDto);
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
    public async Task<IActionResult> GetDirectoryById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetDirectoryById({Id})", id);

            var directory = await _directoryService.GetDirectoryByIdAsync(id);
            if (directory is null)
            {
                _logger.LogWarning("Directory entry not found for id {Id}", id);
                return NotFound(new { Success = false, Message = "Directory entry not found." });
            }

            return Ok(new { Success = true, Data = directory });
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
    [Authorize]
    public async Task<IActionResult> CreateDirectory(CreateDirectoryDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateDirectory(CreateDirectoryDto: {@Dto})", dto);
            var directory = await _directoryService.CreateDirectoryAsync(dto);
            return Ok(new { Success = true, Data = directory });
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

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateDirectory([FromRoute] Guid id, [FromBody] CreateDirectoryDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateDirectory(id={Id}, dto={Dto})", id, JsonSerializer.Serialize(dto));
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
            var directory = await _directoryService.UpdateDirectoryAsync(id, dto);
            return Ok(new { Success = true, Data = directory });
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

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteDirectory([FromRoute] Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteDirectory(id={Id})", id);
            await _directoryService.DeleteDirectoryAsync(id);
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

    [HttpPatch("{id:guid}/togglefavorite")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorite([FromRoute] Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: ToggleFavorite(entityId={EntityId})", id);
            var currentUserId = GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated.");
            await _directoryService.ToggleFavoriteAsync(id);
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

    [HttpPatch("{id:guid}/rate")]
    [Authorize]
    public async Task<IActionResult> Rate([FromRoute] Guid id, [FromBody] RateDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: Rate(entityId={EntityId}, rating={Rating})", id, dto.Rating);
            var directory = await _directoryService.SubmitRatingAsync(id, dto.Rating);
            if (directory is null)
            {
                return NotFound(new { Success = false, Message = "Directory entry not found." });
            }

            return Ok(new { Success = true, Data = directory });
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

    [HttpPost("{id:guid}/logo")]
    [Authorize]
    public async Task<IActionResult> UploadDirectoryLogo([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadDirectoryLogo(id={Id}, file={File})", id, JsonSerializer.Serialize(file));
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A logo file is required." });
            }

            var directory = await _directoryService.UploadDirectoryLogoAsync(id, file);
            return Ok(new { Success = true, Data = directory });
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

    [HttpPost("{id:guid}/cover-image")]
    [Authorize]
    public async Task<IActionResult> UploadDirectoryCoverImage([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadDirectoryCoverImage(id={Id}, file={File})", id, JsonSerializer.Serialize(file));
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A cover image file is required." });
            }

            var directory = await _directoryService.UploadDirectoryCoverImageAsync(id, file);
            return Ok(new { Success = true, Data = directory });
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
