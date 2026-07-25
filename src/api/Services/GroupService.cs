using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;

namespace BikerHub.Services;

public interface IGroupService
{
    Task<IEnumerable<GroupDto>> GetGroupsAsync();
    Task<GroupDto?> GetGroupByIdAsync(int id);
    Task<GroupDto> CreateGroupAsync(CreateGroupDto dto);
}

public class GroupService : IGroupService
{
    private readonly AppDbContext _dbContext;

    public GroupService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<GroupDto>> GetGroupsAsync()
    {
        var groups = await _dbContext.Groups.OrderByDescending(g => g.CreatedAtUtc).ToListAsync();
        return groups.Select(MapGroup);
    }

    public async Task<GroupDto?> GetGroupByIdAsync(int id)
    {
        var group = await _dbContext.Groups.FindAsync(id);
        return group is null ? null : MapGroup(group);
    }

    public async Task<GroupDto> CreateGroupAsync(CreateGroupDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Title, "Title");

        var entity = new Group
        {
            Title = dto.Title,
            Icon = dto.Icon,
            Description = dto.Description,
            LogoUrl = dto.LogoUrl,
            CoverPhotoUrl = dto.CoverPhotoUrl,
            IsPrivate = dto.IsPrivate,
            MembersCount = 0,
        };

        _dbContext.Groups.Add(entity);
        await _dbContext.SaveChangesAsync();
        return MapGroup(entity);
    }

    private static GroupDto MapGroup(Group group)
    {
        return new GroupDto(
            group.Id,
            group.Title,
            group.Icon,
            group.Description,
            group.LogoUrl,
            group.CoverPhotoUrl,
            group.IsPrivate,
            group.MembersCount
        );
    }
}
