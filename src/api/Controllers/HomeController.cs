using System.Diagnostics;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using BikerHub.Api.Dtos;

namespace BikerHub.Api.Controllers;

public class HomeController : BaseController
{
    private readonly ILogger<HomeController> _logger;
    private readonly IConfiguration _configuration;

    public HomeController(ILogger<HomeController> logger, IConfiguration configuration) : base(logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public IActionResult Index()
    {
        _logger.LogDebug("CALLED: Index()");

        _logger.LogInformation("Retrieving application version from configuration.");

        _logger.LogInformation("Retrieving application version from assembly/project.");

        var assembly = Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly();
        var version = assembly?.GetName()?.Version?.ToString()
                      ?? _configuration["Version"]
                      ?? "unknown";

        _logger.LogDebug("Application version retrieved: {Version}", version);

        return Ok(new { version });
    }
}
