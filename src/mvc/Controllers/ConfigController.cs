using Microsoft.AspNetCore.Mvc;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfigService _configService;

    public ConfigController(IConfigService configService)
    {
        _configService = configService;
    }

    [HttpGet("business-types")]
    public async Task<IActionResult> GetBusinessTypes()
    {
        var result = await _configService.GetBusinessTypesAsync();
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("cities")]
    public async Task<IActionResult> GetCities()
    {
        var result = await _configService.GetCitiesAsync();
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("state-divisions")]
    public async Task<IActionResult> GetStateDivisions()
    {
        var result = await _configService.GetStateDivisionsAsync();
        return Ok(new { Success = true, Data = result });
    }
}
