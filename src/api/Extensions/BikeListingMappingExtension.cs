using System.Text.Json;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Services;

namespace BikerHub.Api.Extensions;

public static class BikeListingMappingExtensions
{
    public static IQueryable<BikeListingDto> ProjectToDto(
        this IQueryable<BikeListingEntity> baseQuery,
        AppDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        var currentUserId = Guid.Parse(currentUserService.UserId!);
        return from listing in baseQuery
            select new BikeListingDto
            {
                Id = listing.Id,
                Make = listing.Make,
                Model = listing.Model,
                Edition = listing.Edition,
                Year = listing.Year,
                Price = listing.Price,
                Cc = listing.Cc,
                Type = listing.Type,
                Mileage = listing.Mileage,
                SellerId = listing.CreatedById,
                SellerName = dbContext.Users
                    .Where(u => u.Id == listing.CreatedById)
                    .Select(u => u.DisplayName)
                    .FirstOrDefault()!,
                SellerPhone = listing.SellerPhone,
                SellerCity = listing.SellerCity,
                SellerCountry = listing.SellerCountry,
                Rating = listing.Rating,
                RatingCount = listing.RatingCount,
                MyRating = dbContext.Ratings
                    .Where(r => r.EntityId == listing.Id && r.UserId == currentUserId)
                    .Select(r => (double?)r.Rating)
                    .FirstOrDefault(),
                Vin = listing.Vin,
                Description = listing.Description,
                FavoritesCount = listing.FavoritesCount,
                LikeCount = listing.LikeCount,
                ViewCount = listing.ViewCount,
                IsSold = listing.IsSold,
                IsReported = listing.IsReported,
                IsFavorite = dbContext.Favorites.Any(f => f.EntityId == listing.Id && f.UserId == currentUserId),
                IsLiked = dbContext.Likes.Any(l => l.EntityId == listing.Id && l.UserId == currentUserId),
                Medias = dbContext.Medias
                    .Where(m => m.OwnerId == listing.Id)
                    .Select(m => new MediaDto
                    {
                        Id = m.Id,
                        OwnerId = m.OwnerId,
                        ObjectName = m.ObjectName,
                        ContentType = m.ContentType,
                        Size = m.Size,
                        Url = m.ObjectName
                    })
                    .ToList(),
                CreatedAtUtc = listing.CreatedAtUtc,
                CreatedById = listing.CreatedById,
                UpdatedAtUtc = listing.UpdatedAtUtc,
                UpdatedById = listing.UpdatedById
            };
    }

    public static BikeListingDto? ResolveMediaUrls(this BikeListingDto dto, IStorageService storageService)
    {
        if (dto is null || dto.Medias is null || dto.Medias.Count == 0) return dto;

        foreach (var media in dto.Medias)
        {
            media.Url = storageService.BuildObjectUrl(media.ObjectName);
        }

        return dto;
    }

    public static IEnumerable<BikeListingDto> ResolveMediaUrls(this IEnumerable<BikeListingDto> dtos, IStorageService storageService)
    {
        foreach (var dto in dtos)
        {
            dto.ResolveMediaUrls(storageService);
        }

        return dtos;
    }
}