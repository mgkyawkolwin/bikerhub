using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BikerHub.Services;
using BikerHub.Exceptions;
using System.Net;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookUpController : BaseController
{
    private readonly ILookUpService _lookUpService;
    private readonly ILogger<LookUpController> _logger;

    public LookUpController(ILookUpService lookUpService, ILogger<LookUpController> logger) : base(logger)
    {
        _lookUpService = lookUpService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string category, [FromQuery] string? code, [FromQuery] string? value)
    {
        try
        {
            _logger.LogDebug("CALLED: Get()");
            _logger.LogDebug("Get called with category {Category} and code {Code} and value {Value}", category, code, value);

            if (string.IsNullOrWhiteSpace(category))
            {
                return BadRequest(new { Success = false, Message = "Category is required." });
            }

            var items = await _lookUpService.GetLookUpsAsync(category, code, value);
            return Ok(new { Success = true, Data = items });
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

    // [HttpGet]
    // public async Task<IActionResult> GetByCategory([FromQuery] string category)
    // {
    //     try
    //     {
    //         _logger.LogDebug("CALLED: GetByCategory()");
    //         _logger.LogDebug("GetByCategory called with category {Category}", category);

    //         if (string.IsNullOrWhiteSpace(category))
    //         {
    //             return BadRequest(new { Success = false, Message = "Category is required." });
    //         }

    //         var items = await _lookUpService.GetLookUpsByCategoryAsync(category);
    //         return Ok(new { Success = true, Data = items });
    //     }
    //     catch (CustomException ex)
    //     {
    //         _logger.LogError("Custom exception occurred: {Message}", ex.Message);
    //         return Ok(new { Success = false, Message = ex.Message });
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Unexpected error occurred.");
    //         return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
    //     }
    // }
}
