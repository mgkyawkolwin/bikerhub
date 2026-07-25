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
    Task<BikeListingDto?> GetListingByIdAsync(int id);
    Task<BikeListingDto> CreateListingAsync(CreateBikeListingDto dto);
    Task<BikeListingDto> UploadListingMediaAsync(int listingId, IFormFile file);
    Task ToggleFavoriteAsync(int listingId);
    Task ToggleLikeAsync(int listingId);
    Task<IEnumerable<BikeListingDto>> GetFavoritesAsync();
    Task<BikeListingDto?> SubmitRatingAsync(int listingId, int rating);
}

public class MarketplaceService : IMarketplaceService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService? _storageService;
    private readonly MinioSettings? _minioSettings;

    public MarketplaceService(AppDbContext dbContext, IStorageService? storageService = null, IOptions<MinioSettings>? minioOptions = null)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _minioSettings = minioOptions?.Value;
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

        return new PaginatedResultDto<BikeListingDto>(items.Select(Map).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<BikeListingDto?> GetListingByIdAsync(int id)
    {
        var listing = await _dbContext.BikeListings.FindAsync(id);
        return listing is null ? null : Map(listing);
    }

    public async Task<BikeListingDto> CreateListingAsync(CreateBikeListingDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Title, "Title");

        var entity = new BikeListing
        {
            Title = dto.Title,
            Make = dto.Make,
            Model = dto.Model,
            Year = dto.Year,
            Price = dto.Price,
            Cc = dto.Cc,
            Type = dto.Type,
            Location = dto.Location,
            Phone = dto.Phone,
            ImageUrl = dto.ImageUrl,
            ImagesJson = dto.Images is null ? null : JsonSerializer.Serialize(dto.Images),
            Mileage = dto.Mileage,
            Km = dto.Km,
            Vin = dto.Vin,
            Description = dto.Description,
            CreatedAtUtc = DateTime.UtcNow,
        };

        _dbContext.BikeListings.Add(entity);
        await _dbContext.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<BikeListingDto> UploadListingMediaAsync(int listingId, IFormFile file)
    {
        if (_storageService is null || _minioSettings is null)
            throw new InvalidOperationException("Storage service is not configured.");

        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null)
            throw new CustomException("Listing not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        var url = BuildObjectUrl(objectName);

        var images = string.IsNullOrWhiteSpace(entity.ImagesJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(entity.ImagesJson) ?? new List<string>();

        images.Add(url);
        entity.ImagesJson = JsonSerializer.Serialize(images);

        if (string.IsNullOrWhiteSpace(entity.ImageUrl))
        {
            entity.ImageUrl = url;
        }

        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();
        return Map(entity);
    }

    public async Task ToggleFavoriteAsync(int listingId)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null) return;
        entity.IsFavorite = !entity.IsFavorite;
        entity.FavoritesCount += entity.IsFavorite ? 1 : -1;
        if (entity.FavoritesCount < 0) entity.FavoritesCount = 0;
        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task ToggleLikeAsync(int listingId)
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
        return favorites.Select(Map);
    }

    public async Task<BikeListingDto?> SubmitRatingAsync(int listingId, int rating)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null) return null;

        entity.RatingCount += 1;
        entity.Rating = entity.Rating.HasValue ? ((entity.Rating.Value * (entity.RatingCount - 1) + rating) / entity.RatingCount) : rating;
        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();
        return Map(entity);
    }

    private static BikeListingDto Map(BikeListing entity)
    {
        var images = string.IsNullOrWhiteSpace(entity.ImagesJson)
            ? Enumerable.Empty<string>()
            : JsonSerializer.Deserialize<IEnumerable<string>>(entity.ImagesJson) ?? Enumerable.Empty<string>();

        return new BikeListingDto(
            entity.Id,
            entity.Title,
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
            entity.ImageUrl,
            images,
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

    private string BuildObjectUrl(string objectName)
    {
        if (_minioSettings is null)
            throw new InvalidOperationException("Minio settings are not configured.");

        if (string.IsNullOrWhiteSpace(_minioSettings.ObjectAccessUrl))
            return objectName;

        return $"{_minioSettings.ObjectAccessUrl}/{_minioSettings.BucketName}/{objectName}";
    }
}
