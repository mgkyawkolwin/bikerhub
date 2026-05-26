using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketplaceController : ControllerBase
{
    private readonly IMarketplaceService _marketplaceService;

    public MarketplaceController(IMarketplaceService marketplaceService)
    {
        _marketplaceService = marketplaceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetListings([FromQuery] string? make = null, [FromQuery] string? model = null, [FromQuery] string? modelYear = null, [FromQuery] decimal? priceMin = null, [FromQuery] decimal? priceMax = null, [FromQuery] string? cc = null, [FromQuery] string? type = null, [FromQuery] string? location = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _marketplaceService.GetListingsAsync(make, model, modelYear, priceMin, priceMax, cc, type, location, page, pageSize);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetListingById(int id)
    {
        var listing = await _marketplaceService.GetListingByIdAsync(id);
        if (listing is null)
        {
            return NotFound(new { Success = false, Message = "Listing not found." });
        }

        return Ok(new { Success = true, Data = listing });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateListing(CreateBikeListingDto dto)
    {
        var listing = await _marketplaceService.CreateListingAsync(dto);
        return Ok(new { Success = true, Data = listing });
    }

    [HttpPost("{id}/favorite")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        await _marketplaceService.ToggleFavoriteAsync(id);
        return Ok(new { Success = true });
    }

    [HttpPost("{id}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleLike(int id)
    {
        await _marketplaceService.ToggleLikeAsync(id);
        return Ok(new { Success = true });
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<IActionResult> GetFavorites()
    {
        var favorites = await _marketplaceService.GetFavoritesAsync();
        return Ok(new { Success = true, Data = favorites });
    }

    [HttpPost("{id}/rating")]
    [Authorize]
    public async Task<IActionResult> SubmitRating(int id, [FromBody] int rating)
    {
        var listing = await _marketplaceService.SubmitRatingAsync(id, rating);
        return Ok(new { Success = true, Data = listing });
    }
}
