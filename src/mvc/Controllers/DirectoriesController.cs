using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DirectoriesController : ControllerBase
{
    private readonly IDirectoryService _directoryService;

    public DirectoriesController(IDirectoryService directoryService)
    {
        _directoryService = directoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDirectories([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? query = null, [FromQuery] string? businessType = null, [FromQuery] string? city = null, [FromQuery] string? stateDivision = null)
    {
        var result = await _directoryService.GetDirectoriesAsync(page, pageSize, query, businessType, city, stateDivision);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDirectoryById(int id)
    {
        var directory = await _directoryService.GetDirectoryByIdAsync(id);
        if (directory is null)
        {
            return NotFound(new { Success = false, Message = "Directory entry not found." });
        }

        return Ok(new { Success = true, Data = directory });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateDirectory(CreateDirectoryDto dto)
    {
        var directory = await _directoryService.CreateDirectoryAsync(dto);
        return Ok(new { Success = true, Data = directory });
    }
}
