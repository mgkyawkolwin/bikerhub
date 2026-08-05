using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface IAdminUserService
{
    Task<PaginatedResultDto<AdminUserDto>> GetAllAsync(int page, int pageSize, string? search = null);
    Task<AdminUserDto?> GetByIdAsync(Guid id);
    Task<AdminUserDto> CreateAsync(CreateAdminUserDto dto);
    Task<AdminUserDto?> UpdateAsync(Guid id, UpdateAdminUserDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<AdminUserDto?> AuthenticateAsync(string email, string password);
}
