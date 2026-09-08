using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Extensions;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

public interface IUserService
{
    Task<PaginatedResultDto<UserDto>> GetUsersAsync(int page, int pageSize, string? search = null);
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
}

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<UserEntity> _passwordHasher;
    private readonly ILogger<UserService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public UserService(AppDbContext dbContext, IPasswordHasher<UserEntity> passwordHasher, ILogger<UserService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _logger = logger;
        _currentUserService = currentUserService;
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
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ProjectToDto(_dbContext).ToListAsync();

        return new PaginatedResultDto<UserDto>(items, page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var entity = await _dbContext.Users.FindAsync(id);
        return entity is null ? null : entity.ToDto();
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
            Phone = dto.Phone?.Trim(),
            Address = dto.Address?.Trim(),
            City = dto.City?.Trim(),
            ProfilePictureUrl = dto.ProfilePictureUrl?.Trim(),
            Rating = dto.Rating,
            RatingCount = dto.RatingCount
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password ?? string.Empty);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return user.ToDto();
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

        if (dto.Phone is not null)
        {
            entity.Phone = dto.Phone.Trim();
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

        return entity.ToDto();
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

    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var entity = await _dbContext.Users.FindAsync(userId);
        if (entity is null)
        {
            throw new CustomException("User not found.");
        }

        var verify = _passwordHasher.VerifyHashedPassword(entity, entity.PasswordHash, currentPassword ?? string.Empty);
        if (verify == PasswordVerificationResult.Failed)
        {
            throw new CustomException("Current password is incorrect.");
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
        {
            throw new CustomException("New password is invalid.");
        }

        entity.PasswordHash = _passwordHasher.HashPassword(entity, newPassword);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    
}