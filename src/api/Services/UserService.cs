using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface IUserService
{
    Task<PaginatedResultDto<BikeListingDto>> GetFavoriteListingsAsync(int page, int pageSize, string currentUserId);
}

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<BikeListingDto>> GetFavoriteListingsAsync(int page, int pageSize, string currentUserId)
    {
        var query = _dbContext.BikeListings.Where(x => x.IsFavorite).OrderByDescending(x => x.CreatedAtUtc);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PaginatedResultDto<BikeListingDto>(items.Select(Map).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    private static BikeListingDto Map(BikeListing entity)
    {
        var images = string.IsNullOrWhiteSpace(entity.ImagesJson)
            ? Enumerable.Empty<string>()
            : System.Text.Json.JsonSerializer.Deserialize<IEnumerable<string>>(entity.ImagesJson) ?? Enumerable.Empty<string>();

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
}
