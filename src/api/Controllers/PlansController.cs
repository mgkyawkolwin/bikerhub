using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Services;
using BikerHub.Api.Exceptions;
using System.Net;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController : ControllerBase
{
    private readonly IPlanService _planService;
    private readonly ILogger<PlansController> _logger;

    public PlansController(IPlanService planService, ILogger<PlansController> logger)
    {
        _planService = planService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetPlans([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] Guid? userId = null)
    {
        try
        {
            _logger.LogDebug("CALLED: GetPlans(page={Page}, pageSize={PageSize}, userId={UserId})", page, pageSize, userId);
            var result = await _planService.GetPlansAsync(page, pageSize, userId);
            _logger.LogDebug("Count: {Count}", result.Items.Count());
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPlans");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPlanById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetPlanById(id={Id})", id);
            var plan = await _planService.GetPlanByIdAsync(id);
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(plan));
            if (plan is null)
            {
                return NotFound(new { Success = false, Message = "Plan not found." });
            }

            return Ok(new { Success = true, Data = plan });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetPlanById");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreatePlan(dto={Dto})", JsonSerializer.Serialize(dto));
            var plan = await _planService.CreatePlanAsync(dto);
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(plan));
            return Ok(new { Success = true, Data = plan });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in CreatePlan");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdatePlan([FromRoute] Guid id, [FromBody] UpdatePlanDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdatePlan(id={Id}, dto={Dto})", id, JsonSerializer.Serialize(dto));
            if (dto is null)
            {
                return BadRequest(new { Success = false, Message = "Request body cannot be null." });
            }

            var plan = await _planService.UpdatePlanAsync(id, dto);
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(plan));
            if (plan is null)
            {
                return NotFound(new { Success = false, Message = "Plan not found." });
            }

            return Ok(new { Success = true, Data = plan });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in UpdatePlan");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPatch("{id:guid}/attendance")]
    [Authorize]
    public async Task<IActionResult> UpdatePlanAttendance([FromRoute] Guid id, [FromBody] UpdatePlanAttendanceDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdatePlanAttendance(id={Id}, confirmed={Confirmed})", id, dto?.Confirmed);
            if (dto is null)
            {
                return BadRequest(new { Success = false, Message = "Request body cannot be null." });
            }

            var plan = await _planService.SetPlanAttendanceAsync(id, dto.Confirmed);
            if (plan is null)
            {
                return NotFound(new { Success = false, Message = "Plan not found." });
            }

            return Ok(new { Success = true, Data = plan });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in UpdatePlanAttendance");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}/attendance")]
    [Authorize]
    public async Task<IActionResult> RemovePlanAttendance([FromRoute] Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: RemovePlanAttendance(id={Id})", id);
            var plan = await _planService.RemovePlanAttendanceAsync(id);
            if (plan is null)
            {
                return NotFound(new { Success = false, Message = "Plan not found." });
            }

            return Ok(new { Success = true, Data = plan });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in RemovePlanAttendance");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeletePlan([FromRoute] Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeletePlan(id={Id})", id);
            var deleted = await _planService.DeletePlanAsync(id);
            if (!deleted)
            {
                return NotFound(new { Success = false, Message = "Plan not found." });
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
            _logger.LogError(ex, "Unexpected error occurred in DeletePlan");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
