using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Models;
using BikerHub.Api.Extensions;

namespace BikerHub.Api.Services;

public interface IMarketplaceService
{
    Task<PaginatedResultDto<BikeListingDto>> GetListingsAsync(BikeListingFilterDto filter);
    Task<BikeListingDto?> GetListingByIdAsync(Guid id);
    Task<BikeListingDto> CreateListingAsync(CreateBikeListingDto dto);
    Task<BikeListingDto?> UpdateListingAsync(Guid listingId, CreateBikeListingDto dto);
    Task<bool> DeleteListingAsync(Guid listingId);
    Task<BikeListingDto?> MarkAsSoldAsync(Guid listingId);
    Task<BikeListingDto> UploadListingMediaAsync(Guid listingId, IFormFile file);
    Task<BikeListingDto?> ToggleFavoriteAsync(Guid listingId);
    Task<BikeListingDto?> ToggleLikeAsync(Guid listingId);
    Task<IEnumerable<BikeListingDto>> GetFavoritesAsync();
    Task<BikeListingDto?> SubmitRatingAsync(Guid listingId, int rating);
}

public class MarketplaceService : IMarketplaceService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly ILogger<MarketplaceService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public MarketplaceService(AppDbContext dbContext, ILogger<MarketplaceService> logger, IStorageService storageService, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<BikeListingDto>> GetListingsAsync(BikeListingFilterDto filter)
    {
        var query = _dbContext.BikeListings.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Make)) query = query.Where(x => x.Make == filter.Make);
        if (!string.IsNullOrWhiteSpace(filter.Model)) query = query.Where(x => x.Model == filter.Model);
        if (!string.IsNullOrWhiteSpace(filter.ModelYear) && int.TryParse(filter.ModelYear, out var parsedYear))
        {
            query = query.Where(x => x.Year == parsedYear);
        }
        if (filter.PriceMin.HasValue) query = query.Where(x => x.Price >= filter.PriceMin.Value);
        if (filter.PriceMax.HasValue) query = query.Where(x => x.Price <= filter.PriceMax.Value);
        if (!string.IsNullOrWhiteSpace(filter.Cc)) query = query.Where(x => x.Cc == filter.Cc);
        if (!string.IsNullOrWhiteSpace(filter.Type)) query = query.Where(x => x.Type == filter.Type);
        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            query = query.Where(x => x.SellerCity == filter.City);
        }
        if (!string.IsNullOrWhiteSpace(filter.Country)) query = query.Where(x => x.SellerCountry == filter.Country);
        if (filter.UserId.HasValue) query = query.Where(x => x.CreatedById == filter.UserId.Value);

        var total = await query.CountAsync();
        var items = (await query.ProjectToDto(_dbContext, _currentUserService)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync()).ResolveMediaUrls(_storageService);

        return new PaginatedResultDto<BikeListingDto>(
            items,
            filter.Page,
            filter.PageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)filter.PageSize)));
    }

    public async Task<BikeListingDto?> GetListingByIdAsync(Guid id)
    {
        var listing = await _dbContext.BikeListings
        .ProjectToDto(_dbContext, _currentUserService)
        .FirstOrDefaultAsync(x => x.Id == id);
        if (listing is null) return null;

        return listing.ResolveMediaUrls(_storageService);
    }

    public async Task<BikeListingDto> CreateListingAsync(CreateBikeListingDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Make, "Make");
        DtoValidationHelper.ValidateRequiredString(dto.Model, "Model");
        DtoValidationHelper.ValidateRequiredString(dto.Type, "Type");

        var entity = new BikeListingEntity
        {
            Make = dto.Make,
            Model = dto.Model,
            Edition = dto.Edition,
            Year = dto.Year,
            Price = dto.Price,
            Cc = dto.Cc,
            Type = dto.Type,
            SellerPhone = dto.SellerPhone,
            Mileage = dto.Mileage,
            Vin = dto.Vin,
            SellerCity = dto.SellerCity,
            SellerCountry = dto.SellerCountry,
            Description = dto.Description,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };

        _dbContext.BikeListings.Add(entity);

        var socialProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(x => x.UserId == entity.CreatedById)
            ?? throw new CustomException("Social profile not found for the current user.");
        socialProfile.ListingCount += 1;
        _dbContext.SocialProfiles.Update(socialProfile);

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
                CreatedById = Guid.Parse(_currentUserService.UserId!),
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = Guid.Parse(_currentUserService.UserId!)
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
                    CreatedById = Guid.Parse(_currentUserService.UserId!),
                    UpdatedAtUtc = DateTime.UtcNow,
                    UpdatedById = Guid.Parse(_currentUserService.UserId!)
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
                    CreatedById = Guid.Parse(_currentUserService.UserId!),
                    UpdatedAtUtc = DateTime.UtcNow,
                    UpdatedById = Guid.Parse(_currentUserService.UserId!)
                };
                _dbContext.LookUps.Add(newType);
            }
        }

        await _dbContext.SaveChangesAsync();
        return (await _dbContext.BikeListings.Where(x => x.Id == entity.Id).ProjectToDto(_dbContext, _currentUserService).FirstOrDefaultAsync())!.ResolveMediaUrls(_storageService)!;
    }

    public async Task<BikeListingDto?> UpdateListingAsync(Guid listingId, CreateBikeListingDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Make, "Make");
        DtoValidationHelper.ValidateRequiredString(dto.Model, "Model");
        DtoValidationHelper.ValidateRequiredString(dto.Type, "Type");

        var entity = await _dbContext.BikeListings.FirstOrDefaultAsync(x => x.Id == listingId);
        if (entity is null)
        {
            return null;
        }

        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        if (entity.CreatedById != currentUserId)
        {
            throw new CustomException("You are not allowed to edit this listing.");
        }

        entity.Make = dto.Make;
        entity.Model = dto.Model;
        entity.Edition = dto.Edition;
        entity.Year = dto.Year;
        entity.Price = dto.Price;
        entity.Cc = dto.Cc;
        entity.Type = dto.Type;
        entity.SellerPhone = dto.SellerPhone;
        entity.Mileage = dto.Mileage;
        entity.Vin = dto.Vin;
        entity.SellerCity = dto.SellerCity;
        entity.SellerCountry = dto.SellerCountry;
        entity.Description = dto.Description;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedById = currentUserId;

        _dbContext.BikeListings.Update(entity);
        await _dbContext.SaveChangesAsync();

        return (await _dbContext.BikeListings
            .Where(x => x.Id == entity.Id)
            .ProjectToDto(_dbContext, _currentUserService)
            .FirstOrDefaultAsync())
            ?.ResolveMediaUrls(_storageService);
    }

    public async Task<bool> DeleteListingAsync(Guid listingId)
    {
        var entity = await _dbContext.BikeListings.FirstOrDefaultAsync(x => x.Id == listingId);
        if (entity is null)
        {
            return false;
        }

        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        if (entity.CreatedById != currentUserId)
        {
            throw new CustomException("You are not allowed to delete this listing.");
        }

        var medias = await _dbContext.Medias.Where(x => x.OwnerId == listingId).ToListAsync();
        foreach (var media in medias)
        {
            try
            {
                await _storageService.DeleteObjectAsync(media.ObjectName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete media object {ObjectName} for listing {ListingId}", media.ObjectName, listingId);
            }
        }

        if (medias.Count > 0)
        {
            _dbContext.Medias.RemoveRange(medias);
        }

        var favorites = await _dbContext.Favorites.Where(x => x.EntityId == listingId).ToListAsync();
        if (favorites.Count > 0)
        {
            _dbContext.Favorites.RemoveRange(favorites);
        }

        var likes = await _dbContext.Likes.Where(x => x.EntityId == listingId).ToListAsync();
        if (likes.Count > 0)
        {
            _dbContext.Likes.RemoveRange(likes);
        }

        var ratings = await _dbContext.Ratings.Where(x => x.EntityId == listingId).ToListAsync();
        if (ratings.Count > 0)
        {
            _dbContext.Ratings.RemoveRange(ratings);
        }

        var socialProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(x => x.UserId == entity.CreatedById);
        if (socialProfile is not null)
        {
            socialProfile.ListingCount = Math.Max(0, socialProfile.ListingCount - 1);
            _dbContext.SocialProfiles.Update(socialProfile);
        }

        _dbContext.BikeListings.Remove(entity);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<BikeListingDto?> MarkAsSoldAsync(Guid listingId)
    {
        var entity = await _dbContext.BikeListings.FirstOrDefaultAsync(x => x.Id == listingId);
        if (entity is null)
        {
            return null;
        }

        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        if (entity.CreatedById != currentUserId)
        {
            throw new CustomException("You are not allowed to mark this listing as sold.");
        }

        if (!entity.IsSold)
        {
            entity.IsSold = true;
            entity.UpdatedAtUtc = DateTime.UtcNow;
            entity.UpdatedById = currentUserId;
            _dbContext.BikeListings.Update(entity);
            await _dbContext.SaveChangesAsync();
        }

        return (await _dbContext.BikeListings
            .Where(x => x.Id == entity.Id)
            .ProjectToDto(_dbContext, _currentUserService)
            .FirstOrDefaultAsync())
            ?.ResolveMediaUrls(_storageService);
    }

    public async Task<BikeListingDto> UploadListingMediaAsync(Guid listingId, IFormFile file)
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
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };
        _dbContext.Medias.Add(media);

        await _dbContext.SaveChangesAsync();

        return (await _dbContext.BikeListings.Where(x => x.Id == entity.Id).ProjectToDto(_dbContext, _currentUserService).FirstOrDefaultAsync())!.ResolveMediaUrls(_storageService)!;
    }

    public async Task<BikeListingDto?> ToggleFavoriteAsync(Guid listingId)
    {
        var bikeListing = await _dbContext.BikeListings.FindAsync(listingId);
        if (bikeListing is null) return null;

        var favorite = await _dbContext.Favorites.FirstOrDefaultAsync(f => f.EntityId == listingId && f.UserId == Guid.Parse(_currentUserService.UserId!));
        if (favorite != null)
        {
            _dbContext.Favorites.Remove(favorite);
        }
        else
        {
            var newFavorite = new FavoriteEntity
            {
                EntityId = listingId,
                UserId = Guid.Parse(_currentUserService.UserId!),
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = Guid.Parse(_currentUserService.UserId!),
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = Guid.Parse(_currentUserService.UserId!)
            };
            _dbContext.Favorites.Add(newFavorite);
        }
        bikeListing.FavoritesCount += favorite != null ? -1 : 1;

        _dbContext.BikeListings.Update(bikeListing);
        await _dbContext.SaveChangesAsync();

        return (await _dbContext.BikeListings.Where(x => x.Id == bikeListing.Id).ProjectToDto(_dbContext, _currentUserService).FirstOrDefaultAsync())!.ResolveMediaUrls(_storageService)!;
    }

    public async Task<BikeListingDto?> ToggleLikeAsync(Guid listingId)
    {
        var bikeListing = await _dbContext.BikeListings.FindAsync(listingId);
        if (bikeListing is null) return null;

        var like = await _dbContext.Likes.FirstOrDefaultAsync(l => l.EntityId == listingId && l.UserId == Guid.Parse(_currentUserService.UserId!));
        if (like != null)
        {
            _dbContext.Likes.Remove(like);
        }
        else
        {
            var newLike = new LikeEntity
            {
                EntityId = listingId,
                UserId = Guid.Parse(_currentUserService.UserId!),
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = Guid.Parse(_currentUserService.UserId!),
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = Guid.Parse(_currentUserService.UserId!)
            };
            _dbContext.Likes.Add(newLike);
        }

        bikeListing.LikeCount += like != null ? -1 : 1;
        _dbContext.BikeListings.Update(bikeListing);
        await _dbContext.SaveChangesAsync();
        return (await _dbContext.BikeListings.Where(x => x.Id == bikeListing.Id).ProjectToDto(_dbContext, _currentUserService).FirstOrDefaultAsync())!.ResolveMediaUrls(_storageService)!;
    }

    public async Task<IEnumerable<BikeListingDto>> GetFavoritesAsync()
    {
        var userFavoriteBikes = (await _dbContext.BikeListings
        .Join(
            _dbContext.Favorites.Where(f => f.UserId == Guid.Parse(_currentUserService.UserId!)),
            bike => bike.Id,
            fav => fav.EntityId,
            (bike, fav) => bike
        )
        .ProjectToDto(_dbContext, _currentUserService)
        .ToListAsync()).ResolveMediaUrls(_storageService);

        return userFavoriteBikes;
    }

    public async Task<BikeListingDto?> SubmitRatingAsync(Guid listingId, int rating)
    {
        var entity = await _dbContext.BikeListings.FindAsync(listingId);
        if (entity is null) return null;

        var currentUserId = Guid.Parse(_currentUserService.UserId!);
        var existingRating = await _dbContext.Ratings.FirstOrDefaultAsync(r => r.EntityId == listingId && r.UserId == currentUserId);

        if (existingRating is null)
        {
            var ratingCount = entity.RatingCount + 1;
            entity.Rating = entity.RatingCount > 0
                ? ((entity.Rating * entity.RatingCount) + rating) / ratingCount
                : rating;
            entity.RatingCount = ratingCount;

            var ratingEntity = new RatingEntity
            {
                EntityId = listingId,
                UserId = currentUserId,
                Rating = rating,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = currentUserId,
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = currentUserId
            };
            _dbContext.Ratings.Add(ratingEntity);
        }
        else
        {
            var totalRating = entity.Rating * entity.RatingCount - existingRating.Rating + rating;
            existingRating.Rating = rating;
            existingRating.UpdatedAtUtc = DateTime.UtcNow;
            existingRating.UpdatedById = currentUserId;
            _dbContext.Ratings.Update(existingRating);
            entity.Rating = entity.RatingCount > 0 ? totalRating / entity.RatingCount : rating;
        }

        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedById = currentUserId;
        _dbContext.BikeListings.Update(entity);

        await _dbContext.SaveChangesAsync();

        return (await _dbContext.BikeListings.Where(x => x.Id == entity.Id).ProjectToDto(_dbContext, _currentUserService).FirstOrDefaultAsync())!.ResolveMediaUrls(_storageService)!;
    }
}
