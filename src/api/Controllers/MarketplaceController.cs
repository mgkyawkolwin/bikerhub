using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Services;
using BikerHub.Api.Exceptions;
using System.Net;
using System.Text.Json;

namespace BikerHub.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
public class MarketplaceController : BaseController
{
    private readonly IMarketplaceService _marketplaceService;
    private readonly ILogger<MarketplaceController> _logger;

    public MarketplaceController(IMarketplaceService marketplaceService, ILogger<MarketplaceController> logger) : base(logger)
    {
        _marketplaceService = marketplaceService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetListings([FromQuery] BikeListingFilterDto filter)
    {
        try
        {
            _logger.LogDebug("CALLED: GetListings({Filter})", JsonSerializer.Serialize(filter));
            var result = await _marketplaceService.GetListingsAsync(filter);
            _logger.LogDebug("Listings count: {Count}", result.Items?.Count() ?? 0);
            _logger.LogDebug("Listings First/Default: {Result}", JsonSerializer.Serialize(result.Items?.FirstOrDefault()));
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching listings.", Details = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetListingById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetListingById({ListingId})", id);
            var listing = await _marketplaceService.GetListingByIdAsync(id);
            if (listing is null)
            {
                return NotFound(new { Success = false, Message = "Listing not found." });
            }
            _logger.LogDebug("Listing retrieved successfully: {Listing}", JsonSerializer.Serialize(listing));

            return Ok(new { Success = true, Data = listing });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching the listing.", Details = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateListing(CreateBikeListingDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateListing(CreateBikeListingDto: {Dto})", JsonSerializer.Serialize(dto));
            var listing = await _marketplaceService.CreateListingAsync(dto);
            _logger.LogDebug("Listing created successfully: {Listing}", JsonSerializer.Serialize(listing));
            return Ok(new { Success = true, Data = listing });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while creating the listing.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/media")]
    [Authorize]
    public async Task<IActionResult> UploadListingMedia([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadListingMedia(id={ListingId}, file={File})", id, file.Name);
            if (file is null)
            {
                return BadRequest(new { Success = false, Message = "A media file is required." });
            }

            var listing = await _marketplaceService.UploadListingMediaAsync(id, file);
            _logger.LogDebug("Listing : {Listing}", JsonSerializer.Serialize(listing));
            return Ok(new { Success = true, Data = listing });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while uploading listing media.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/favorite")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorite(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: ToggleFavorite({ListingId})", id);
            await _marketplaceService.ToggleFavoriteAsync(id);
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
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while toggling the favorite.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleLike(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: ToggleLike({ListingId})", id);
            await _marketplaceService.ToggleLikeAsync(id);
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
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while toggling the like.", Details = ex.Message });
        }
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<IActionResult> GetFavorites()
    {
        try
        {
            _logger.LogDebug("CALLED: GetFavorites()");
            var favorites = await _marketplaceService.GetFavoritesAsync();
            _logger.LogDebug("Listing result: {Favorites}", JsonSerializer.Serialize(favorites));
            return Ok(new { Success = true, Data = favorites });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while fetching favorites.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/rating")]
    [Authorize]
    public async Task<IActionResult> SubmitRating(Guid id, RateDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: SubmitRating({ListingId}, {Rating})", id, dto.Rating);
            var listing = await _marketplaceService.SubmitRatingAsync(id, dto.Rating);
            _logger.LogDebug("Listing result: {Listing}", JsonSerializer.Serialize(listing));
            return Ok(new { Success = true, Data = listing });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An error occurred while submitting the rating.", Details = ex.Message });
        }
    }
}
