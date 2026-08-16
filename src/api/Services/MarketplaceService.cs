using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Models;

namespace BikerHub.Services;

public interface IMarketplaceService
{
    Task<PaginatedResultDto<BikeListingDto>> GetListingsAsync(string? make, string? model, string? modelYear, decimal? priceMin, decimal? priceMax, string? cc, string? type, string? location, int page, int pageSize);
    Task<BikeListingDto?> GetListingByIdAsync(Guid id);
    Task<BikeListingDto> CreateListingAsync(CreateBikeListingDto dto, Guid currentUserId);
    Task<BikeListingDto> UploadListingMediaAsync(Guid listingId, IFormFile file, Guid currentUserId);
    Task ToggleFavoriteAsync(Guid listingId);
    Task ToggleLikeAsync(Guid listingId);
    Task<IEnumerable<BikeListingDto>> GetFavoritesAsync();
    Task<BikeListingDto?> SubmitRatingAsync(Guid listingId, int rating);
}

public class MarketplaceService : IMarketplaceService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly ILogger<MarketplaceService> _logger;

    public MarketplaceService(AppDbContext dbContext, ILogger<MarketplaceService> logger, IStorageService storageService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<BikeListingDto>> GetListingsAsync(string? make, string? model, string? modelYear, decimal? priceMin, decimal? priceMax, string? cc, string? type, string? location, int page, int pageSize)
    {
        var query = _dbContext.BikeListings.AsQueryable();

        if (!string.IsNullOrWhiteSpace(make)) query = query.Where(x => x.Make == make);
        if (!string.IsNullOrWhiteSpace(model)) query = query.Where(x => x.Model == model);
        if (!string.IsNullOrWhiteSpace(modelYear) && int.TryParse(modelYear, out var parsedYear))
        {
            query = query.Where(x => x.Year == parsedYear);
        }
        if (priceMin.HasValue) query = query.Where(x => x.Price >= priceMin.Value);
        if (priceMax.HasValue) query = query.Where(x => x.Price <= priceMax.Value);
        if (!string.IsNullOrWhiteSpace(cc)) query = query.Where(x => x.Cc == cc);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(x => x.Type == type);
        if (!string.IsNullOrWhiteSpace(location)) query = query.Where(x => x.Location == location);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var listingIds = items.Select(x => x.Id).ToList();
        var medias = await _dbContext.Medias.Where(m => listingIds.Contains(m.OwnerId)).ToListAsync();
        var mediaLookup = medias.GroupBy(m => m.OwnerId).ToDictionary(g => g.Key, g => g.ToList());

        return new PaginatedResultDto<BikeListingDto>(
            [.. items.Select(item => Map(item, mediaLookup.ContainsKey(item.Id) ? mediaLookup[item.Id] : null))],
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<BikeListingDto?> GetListingByIdAsync(Guid id)
    {
        var listing = await _dbContext.BikeListings
        .GroupJoin(
            _dbContext.Medias,
            listing => listing.Id,
            media => media.OwnerId,
            (listing, medias) => new { Listing = listing, Medias = medias }
        )
        .FirstOrDefaultAsync(x => x.Listing.Id == id);
        if (listing is null) return null;

        var medias = listing.Medias.ToList();
        return Map(listing.Listing, medias);
    }

    public async Task<BikeListingDto> CreateListingAsync(CreateBikeListingDto dto, Guid currentUserId)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Make, "Make");
        DtoValidationHelper.ValidateRequiredString(dto.Model, "Model");
        DtoValidationHelper.ValidateRequiredString(dto.Type, "Type");

        var entity = new BikeListing
        {
            Make = dto.Make,
            Model = dto.Model,
            Year = dto.Year,
            Price = dto.Price,
            Cc = dto.Cc,
            Type = dto.Type,
            Location = dto.Location,
            Phone = dto.Phone,
            Mileage = dto.Mileage,
            Km = dto.Km,
            Vin = dto.Vin,
            Description = dto.Description,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };

        _dbContext.BikeListings.Add(entity);

        var existingMake = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "MAKE" && x.Code.Contains(dto.Make!.ToUpperInvariant()));
        _logger.LogTrace("Existing make: {ExistingMake}", JsonSerializer.Serialize(existingMake));
        if (existingMake is null)
        {
            var newMake = new LookUpEntity
            {
                Id = Guid.NewGuid(),
                Category = "MAKE",
                Code = dto.Make!.ToUpperInvariant(),
                Value = dto.Make,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.LookUps.Add(newMake);
        }

        if (!string.IsNullOrWhiteSpace(dto.Model))
        {
            var existingModel = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "MODEL" && x.Code.Contains(dto.Model!.ToUpperInvariant()));
            _logger.LogTrace("Existing model: {ExistingModel}", JsonSerializer.Serialize(existingModel));
            if (existingModel is null)
            {
                var newModel = new LookUpEntity
                {
                    Id = Guid.NewGuid(),
                    Category = "MODEL",
                    Code = dto.Model!.ToUpperInvariant(),
                    Value = dto.Model,
                    CreatedAtUtc = DateTime.UtcNow,
                    CreatedById = currentUserId,
                    UpdatedAtUtc = DateTime.UtcNow,
                    UpdatedById = currentUserId
                };
                _dbContext.LookUps.Add(newModel);
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.Type))
        {
            var existingType = await _dbContext.LookUps.FirstOrDefaultAsync(x => x.Category == "BIKE_TYPE" && x.Code.Contains(dto.Type!.ToUpperInvariant()));
            _logger.LogTrace("Existing type: {ExistingType}", JsonSerializer.Serialize(existingType));
            if (existingType is null)
            {
                var newType = new LookUpEntity
                {
                    Id = Guid.NewGuid(),
                    Category = "BIKE_TYPE",
                    Code = dto.Type!.ToUpperInvariant(),
                    Value = dto.Type,
                    CreatedAtUtc = DateTime.UtcNow,
                    CreatedById = currentUserId,
                    UpdatedAtUtc = DateTime.UtcNow,
                    UpdatedById = currentUserId
                };
                _dbContext.LookUps.Add(newType);
            }
        }

        await _dbContext.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<BikeListingDto> UploadListingMediaAsync(Guid listingId, IFormFile file, Guid currentUserId)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null)
            throw new CustomException("Listing not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        var media = new MediaEntity
        {
            OwnerId = entity.Id,
            ObjectName = objectName,
            ContentType = file.ContentType ?? "application/octet-stream",
            Size = file.Length,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };
        _dbContext.Medias.Add(media);

        await _dbContext.SaveChangesAsync();

        var medias = await _dbContext.Medias.Where(m => m.OwnerId == entity.Id).ToListAsync();
        return Map(entity, medias);
    }

    public async Task ToggleFavoriteAsync(Guid listingId)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null) return;

        entity.IsFavorite = !entity.IsFavorite;
        entity.FavoritesCount += entity.IsFavorite ? 1 : -1;
        if (entity.FavoritesCount < 0) entity.FavoritesCount = 0;

        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task ToggleLikeAsync(Guid listingId)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null) return;

        entity.IsLiked = !entity.IsLiked;
        entity.LikeCount += entity.IsLiked ? 1 : -1;
        if (entity.LikeCount < 0) entity.LikeCount = 0;

        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<BikeListingDto>> GetFavoritesAsync()
    {
        var favorites = await _dbContext.BikeListings.Where(x => x.IsFavorite).OrderByDescending(x => x.CreatedAtUtc).ToListAsync();
        var favoriteIds = favorites.Select(x => x.Id).ToList();
        var medias = await _dbContext.Medias.Where(m => favoriteIds.Contains(m.OwnerId)).ToListAsync();
        var mediaLookup = medias.GroupBy(m => m.OwnerId).ToDictionary(g => g.Key, g => g.ToList());

        return favorites.Select(f => Map(f, mediaLookup.ContainsKey(f.Id) ? mediaLookup[f.Id] : null));
    }

    public async Task<BikeListingDto?> SubmitRatingAsync(Guid listingId, int rating)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null) return null;

        entity.RatingCount += 1;
        entity.Rating = entity.Rating.HasValue ? ((entity.Rating.Value * (entity.RatingCount - 1) + rating) / entity.RatingCount) : rating;

        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();

        return Map(entity, await _dbContext.Medias.Where(m => m.OwnerId == entity.Id).ToListAsync());
    }

    private BikeListingDto Map(BikeListing entity, IEnumerable<MediaEntity>? medias = null)
    {
        return new BikeListingDto(
            entity.Id,
            entity.Make,
            entity.Model,
            entity.Year,
            entity.Price,
            entity.Cc,
            entity.Type,
            entity.SellerId,
            entity.SellerName,
            entity.Location,
            entity.Rating,
            entity.RatingCount,
            entity.Phone,
            medias?.Select(m => new MediaDto
            {
                Id = m.Id,
                OwnerId = m.OwnerId,
                ObjectName = m.ObjectName,
                ContentType = m.ContentType,
                Size = m.Size,
                Url = _storageService.BuildObjectUrl(m.ObjectName)
            }).ToList(),
            entity.Mileage,
            entity.Km,
            entity.Vin,
            entity.Description,
            entity.FavoritesCount,
            entity.IsFavorite,
            entity.IsLiked,
            entity.LikeCount,
            entity.ViewCount,
            entity.CreatedAtUtc
        );
    }
}
