using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;

namespace BikerHub.Services;

public interface IUserService
{
    Task<PaginatedResultDto<BikeListingDto>> GetFavoriteListingsAsync(int page, int pageSize, string currentUserId);
    Task<PaginatedResultDto<UserDto>> GetUsersAsync(int page, int pageSize, string? search = null);
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteAsync(Guid id);
}

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<UserEntity> _passwordHasher;

    public UserService(AppDbContext dbContext, IPasswordHasher<UserEntity> passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<PaginatedResultDto<BikeListingDto>> GetFavoriteListingsAsync(int page, int pageSize, string currentUserId)
    {
        var query = _dbContext.BikeListings.Where(x => x.IsFavorite).OrderByDescending(x => x.CreatedAtUtc);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PaginatedResultDto<BikeListingDto>(items.Select(Map).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<PaginatedResultDto<UserDto>> GetUsersAsync(int page, int pageSize, string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _dbContext.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim();
            query = query.Where(x => x.UserName.Contains(normalized) || x.DisplayName.Contains(normalized) || x.Email.Contains(normalized) || x.City.Contains(normalized));
        }

        query = query.OrderByDescending(x => x.CreatedAtUtc);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<UserDto>(items.Select(Map).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var entity = await _dbContext.Users.FindAsync(id);
        return entity is null ? null : Map(entity);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        if (await _dbContext.Users.AnyAsync(x => x.UserName.ToLower() == dto.UserName.Trim().ToLower() || x.Email.ToLower() == dto.Email.Trim().ToLower()))
        {
            throw new CustomException("A user with that username or email already exists.");
        }

        var user = new UserEntity
        {
            UserName = dto.UserName.Trim(),
            DisplayName = dto.DisplayName.Trim(),
            Email = dto.Email.Trim(),
            Address = dto.Address?.Trim(),
            City = dto.City?.Trim(),
            ProfilePictureUrl = dto.ProfilePictureUrl?.Trim(),
            Rating = dto.Rating,
            RatingCount = dto.RatingCount
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password ?? string.Empty);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return Map(user);
    }

    public async Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var entity = await _dbContext.Users.FindAsync(id);
        if (entity is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(dto.UserName))
        {
            var normalizedUserName = dto.UserName.Trim();
            if (await _dbContext.Users.AnyAsync(x => x.Id != id && x.UserName.ToLower() == normalizedUserName.ToLower()))
            {
                throw new CustomException("A user with that username already exists.");
            }
            entity.UserName = normalizedUserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var normalizedEmail = dto.Email.Trim();
            if (await _dbContext.Users.AnyAsync(x => x.Id != id && x.Email.ToLower() == normalizedEmail.ToLower()))
            {
                throw new CustomException("A user with that email already exists.");
            }
            entity.Email = normalizedEmail;
        }

        if (!string.IsNullOrWhiteSpace(dto.DisplayName))
        {
            entity.DisplayName = dto.DisplayName.Trim();
        }

        if (dto.Address is not null)
        {
            entity.Address = dto.Address.Trim();
        }

        if (dto.City is not null)
        {
            entity.City = dto.City.Trim();
        }

        if (dto.ProfilePictureUrl is not null)
        {
            entity.ProfilePictureUrl = dto.ProfilePictureUrl.Trim();
        }

        if (dto.Rating.HasValue)
        {
            entity.Rating = dto.Rating;
        }

        if (dto.RatingCount.HasValue)
        {
            entity.RatingCount = dto.RatingCount.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            entity.PasswordHash = _passwordHasher.HashPassword(entity, dto.Password);
        }

        entity.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _dbContext.Users.FindAsync(id);
        if (entity is null)
        {
            return false;
        }

        _dbContext.Users.Remove(entity);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    private static UserDto Map(UserEntity entity)
    {
        return new UserDto
        {
            Id = entity.Id,
            UserName = entity.UserName,
            DisplayName = entity.DisplayName,
            Email = entity.Email,
            Address = entity.Address,
            City = entity.City,
            Rating = entity.Rating,
            RatingCount = entity.RatingCount,
            ProfilePictureUrl = entity.ProfilePictureUrl,
            Token = null
        };
    }

    private static BikeListingDto Map(BikeListing entity)
    {
        var images = string.IsNullOrWhiteSpace(entity.ImagesJson)
            ? Enumerable.Empty<string>()
            : System.Text.Json.JsonSerializer.Deserialize<IEnumerable<string>>(entity.ImagesJson) ?? Enumerable.Empty<string>();

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
