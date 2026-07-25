using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;
using System.Net;
using BikerHub.Exceptions;

namespace BikerHub.Controllers;

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
    public async Task<IActionResult> GetReports()
    {

        try
        {
            _logger.LogDebug("CALLED: GetReports()");
            var reports = await _stolenBikeService.GetReportsAsync();
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReportById(int id)
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

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateReport(StolenBikeReportDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateReport()");
            var created = await _stolenBikeService.CreateReportAsync(dto);
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
