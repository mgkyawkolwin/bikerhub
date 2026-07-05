using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookUpController : ControllerBase
{
    private readonly ILookUpService _lookUpService;
    private readonly ILogger<LookUpController> _logger;

    public LookUpController(ILookUpService lookUpService, ILogger<LookUpController> logger)
    {
        _lookUpService = lookUpService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetByCategory([FromQuery] string category)
    {
        try
        {
            _logger.LogInformation("CALLED GetByCategory()");
            _logger.LogDebug("GetByCategory called with category {Category}", category);

            if (string.IsNullOrWhiteSpace(category))
            {
                return BadRequest(new { Success = false, Message = "Category is required." });
            }

            var items = await _lookUpService.GetLookUpsByCategoryAsync(category);
            return Ok(new { Success = true, Data = items });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in GetByCategory");
            return StatusCode(500, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
