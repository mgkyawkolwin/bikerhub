using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StolenBikesController : ControllerBase
{
    private readonly IStolenBikeService _stolenBikeService;

    public StolenBikesController(IStolenBikeService stolenBikeService)
    {
        _stolenBikeService = stolenBikeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetReports()
    {
        var reports = await _stolenBikeService.GetReportsAsync();
        return Ok(new { Success = true, Data = reports });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReportById(int id)
    {
        var report = await _stolenBikeService.GetReportByIdAsync(id);
        if (report is null)
        {
            return NotFound(new { Success = false, Message = "Report not found." });
        }

        return Ok(new { Success = true, Data = report });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateReport(StolenBikeReportDto dto)
    {
        var created = await _stolenBikeService.CreateReportAsync(dto);
        return Ok(new { Success = true, Data = created });
    }
}
