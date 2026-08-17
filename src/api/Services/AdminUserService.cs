using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

public class AdminUserService : IAdminUserService
{
    private readonly AppDbContext _dbContext;
    private readonly PasswordHasher<AdminUser> _passwordHasher;

    public AdminUserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
        _passwordHasher = new PasswordHasher<AdminUser>();
    }

    public async Task<PaginatedResultDto<AdminUserDto>> GetAllAsync(int page, int pageSize, string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _dbContext.AdminUsers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim();
            query = query.Where(x => x.UserName.Contains(normalized) || x.Email.Contains(normalized));
        }

        query = query.OrderByDescending(x => x.CreatedAtUtc);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<AdminUserDto>(
            items.Select(Map).ToList(),
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<AdminUserDto?> GetByIdAsync(Guid id)
    {
        var entity = await _dbContext.AdminUsers.FindAsync(id);
        return entity is null ? null : Map(entity);
    }

    public async Task<AdminUserDto> CreateAsync(CreateAdminUserDto dto)
    {
        if (await _dbContext.AdminUsers.AnyAsync(x => x.Email.ToLower() == dto.Email.Trim().ToLower()))
        {
            throw new CustomException("An admin user with that email already exists.");
        }

        var entity = new AdminUser
        {
            UserName = dto.UserName.Trim(),
            Email = dto.Email.Trim(),
            Role = dto.Role.Trim(),
            IsActive = dto.IsActive,
            PasswordHash = _passwordHasher.HashPassword(new AdminUser(), dto.Password)
        };

        _dbContext.AdminUsers.Add(entity);
        await _dbContext.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<AdminUserDto?> UpdateAsync(Guid id, UpdateAdminUserDto dto)
    {
        var entity = await _dbContext.AdminUsers.FindAsync(id);
        if (entity is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(dto.UserName))
        {
            entity.UserName = dto.UserName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var exists = await _dbContext.AdminUsers.AnyAsync(x => x.Id != id && x.Email.ToLower() == dto.Email.Trim().ToLower());
            if (exists)
            {
                throw new CustomException("An admin user with that email already exists.");
            }

            entity.Email = dto.Email.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.Role))
        {
            entity.Role = dto.Role.Trim();
        }

        if (dto.IsActive.HasValue)
        {
            entity.IsActive = dto.IsActive.Value;
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
        var entity = await _dbContext.AdminUsers.FindAsync(id);
        if (entity is null)
        {
            return false;
        }

        _dbContext.AdminUsers.Remove(entity);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<AdminUserDto?> AuthenticateAsync(string email, string password)
    {
        var entity = await _dbContext.AdminUsers
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email.Trim().ToLower() && x.IsActive);

        if (entity is null)
        {
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(entity, entity.PasswordHash, password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return null;
        }

        entity.LastLoginAtUtc = DateTime.UtcNow;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Map(entity);
    }

    private static AdminUserDto Map(AdminUser entity)
    {
        return new AdminUserDto
        {
            Id = entity.Id,
            UserName = entity.UserName,
            Email = entity.Email,
            Role = entity.Role,
            IsActive = entity.IsActive,
            LastLoginAtUtc = entity.LastLoginAtUtc,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc
        };
    }
}
