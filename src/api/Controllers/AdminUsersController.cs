using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;
using System.Net;

namespace BikerHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AdminUsersController : BaseController
{
    private readonly IAdminUserService _adminUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(IAdminUserService adminUserService, ILogger<AdminUsersController> logger) : base(logger)
    {
        _adminUserService = adminUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        try
        {
            _logger.LogDebug("CALLED: GetAll()");
            var result = await _adminUserService.GetAllAsync(page, pageSize, search);
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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetById({Id})", id);
            var result = await _adminUserService.GetByIdAsync(id);
            if (result is null)
            {
                return NotFound(new { Success = false, Message = "Admin user not found." });
            }

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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: Create()");
            var result = await _adminUserService.CreateAsync(dto);
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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAdminUserDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: Update({Id})", id);
            var result = await _adminUserService.UpdateAsync(id, dto);
            if (result is null)
            {
                return NotFound(new { Success = false, Message = "Admin user not found." });
            }

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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: Delete({Id})", id);
            var deleted = await _adminUserService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { Success = false, Message = "Admin user not found." });
            }

            return Ok(new { Success = true, Message = "Admin user deleted successfully." });
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
