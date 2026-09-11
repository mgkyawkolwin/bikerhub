using BikerHub.Api.Exceptions;
using BikerHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace BikerHub.Api.Controllers;

[Route("share")]
public class ShareController : Controller
{
    private readonly ISocialService _socialService;
    private readonly IMarketplaceService _marketplaceService;
    private readonly IPlanService _planService;
    private readonly IDirectoryService _directoryService;
    private readonly ILogger<ShareController> _logger;

    public ShareController(ISocialService socialService, IMarketplaceService marketplaceService, IPlanService planService, IDirectoryService directoryService, ILogger<ShareController> logger)
    {
        _socialService = socialService;
        _marketplaceService = marketplaceService;
        _planService = planService;
        _directoryService = directoryService;
        _logger = logger;
    }

    [HttpGet("posts/{id:guid}")]
    public async Task<IActionResult> Post(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: Post(id={Id})", id);
            var post = await _socialService.GetPostByIdAsync(id);
            if (post is null)
            {
                _logger.LogWarning("Post not found for id {Id}", id);
                return NotFound(new { Success = false, Message = "Post not found." });
            }

            return View(post);
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return NotFound(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in Post");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("marketplace/{id:guid}")]
    public async Task<IActionResult> Marketplace(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: Marketplace(id={Id})", id);
            var listing = await _marketplaceService.GetListingByIdAsync(id);
            if (listing is null)
            {
                _logger.LogWarning("Marketplace listing not found for id {Id}", id);
                return NotFound(new { Success = false, Message = "Marketplace listing not found." });
            }

            return View(listing);
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return NotFound(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in Marketplace");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("plans/{id:guid}")]
    public async Task<IActionResult> Plan(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: Plan(id={Id})", id);
            var plan = await _planService.GetPlanByIdAsync(id);
            if (plan is null)
            {
                _logger.LogWarning("Plan not found for id {Id}", id);
                return NotFound(new { Success = false, Message = "Plan not found." });
            }

            return View(plan);
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return NotFound(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in Plan");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("directories/{id:guid}")]
    public async Task<IActionResult> Directory(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: Directory(id={Id})", id);
            var directory = await _directoryService.GetDirectoryByIdAsync(id);
            if (directory is null)
            {
                _logger.LogWarning("Directory entry not found for id {Id}", id);
                return NotFound(new { Success = false, Message = "Directory entry not found." });
            }

            return View(directory);
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return NotFound(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in Directory");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
