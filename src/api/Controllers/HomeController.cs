using System.Diagnostics;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using BikerHub.Dtos;

namespace BikerHub.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IConfiguration _configuration;

    public HomeController(ILogger<HomeController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
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

        return Json(new { version });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
