using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Services;
using System.Net;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StolenBikesController : BaseController
{
    private readonly IStolenBikeService _stolenBikeService;
    private readonly ILogger<StolenBikesController> _logger;

    public StolenBikesController(IStolenBikeService stolenBikeService, ILogger<StolenBikesController> logger) : base(logger)
    {
        _stolenBikeService = stolenBikeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetReports([FromQuery] StolenBikeReportFilterDto filter)
    {
        try
        {
            _logger.LogDebug("CALLED: GetReports({Filter})", System.Text.Json.JsonSerializer.Serialize(filter));
            var reports = await _stolenBikeService.GetReportsAsync(filter);
            _logger.LogDebug("Reports count: {Count}", reports?.Items?.Count() ?? 0);
            _logger.LogDebug("Reports First/Default: {Result}", System.Text.Json.JsonSerializer.Serialize(reports?.Items?.FirstOrDefault()));
            return Ok(new { Success = true, Data = reports });
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
    public async Task<IActionResult> GetReportById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetReportById({Id})", id);
            var report = await _stolenBikeService.GetReportByIdAsync(id);
            if (report is null)
            {
                return NotFound(new { Success = false, Message = "Report not found." });
            }

            return Ok(new { Success = true, Data = report });
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
    public async Task<IActionResult> DeleteReport([FromRoute] Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteReport({ReportId})", id);
            var deleted = await _stolenBikeService.DeleteReportAsync(id);
            if (!deleted)
            {
                return NotFound(new { Success = false, Message = "Report not found." });
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
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("{id:guid}/media")]
    [Authorize]
    public async Task<IActionResult> UploadReportMedia([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadReportMedia(id={Id}, file={File})", id, file?.FileName ?? string.Empty);
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A media file is required." });
            }

            var currentUserId = GetCurrentUserId() ?? throw new UnauthorizedAccessException("Invalid session user.");
            var report = await _stolenBikeService.UploadReportMediaAsync(id, file);
            return Ok(new { Success = true, Data = report });
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
    public async Task<IActionResult> CreateReport(StolenBikeReportDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateReport()");
            _logger.LogDebug("DTO: {Dto}", System.Text.Json.JsonSerializer.Serialize(dto));
            var created = await _stolenBikeService.CreateReportAsync(dto);
            _logger.LogDebug("RESULT: {Report}", System.Text.Json.JsonSerializer.Serialize(created));
            return Ok(new { Success = true, Data = created });
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
