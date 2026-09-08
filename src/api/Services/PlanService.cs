using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Extensions;

namespace BikerHub.Api.Services;

public interface IPlanService
{
    Task<PaginatedResultDto<PlanDto>> GetPlansAsync(int page, int pageSize, Guid? userId = null);
    Task<PlanDto?> GetPlanByIdAsync(Guid id);
    Task<PlanDto> CreatePlanAsync(CreatePlanDto dto);
    Task<PlanDto?> UpdatePlanAsync(Guid id, UpdatePlanDto dto);
    Task<PlanDto?> SetPlanAttendanceAsync(Guid planId, bool confirmed);
    Task<PlanDto?> RemovePlanAttendanceAsync(Guid planId);
    Task<bool> DeletePlanAsync(Guid id);
}

public class PlanService : IPlanService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<PlanService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGoogleMapsService _googleMapsService;

    public PlanService(AppDbContext dbContext, ILogger<PlanService> logger, ICurrentUserService currentUserService, IGoogleMapsService googleMapsService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _currentUserService = currentUserService;
        _googleMapsService = googleMapsService;
    }

    public async Task<PaginatedResultDto<PlanDto>> GetPlansAsync(int page, int pageSize, Guid? userId = null)
    {
        var query = _dbContext.Plans.AsQueryable();
        if (userId.HasValue)
        {
            query = query.Where(plan => plan.CreatedById == userId.Value);
        }
        query = query.OrderByDescending(plan => plan.CreatedAtUtc);
        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectToDto(_dbContext, _googleMapsService)
            .ToListAsync();

        return new PaginatedResultDto<PlanDto>(
            items,
            page,
            pageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)pageSize))
        );
    }

    public async Task<PlanDto?> GetPlanByIdAsync(Guid id)
    {
        return await _dbContext.Plans
            .Where(plan => plan.Id == id)
            .ProjectToDto(_dbContext, _googleMapsService)
            .FirstOrDefaultAsync();
    }

    public async Task<PlanDto> CreatePlanAsync(CreatePlanDto dto)
    {
        DtoValidationHelper.ValidateRequiredString(dto.Title, "Title");
        DtoValidationHelper.ValidateRequiredString(dto.Description, "Description");

        var plan = new PlanEntity
        {
            Title = dto.Title,
            Description = dto.Description,
            Distance = dto.Distance,
            Duration = dto.Duration,
            Elevation = dto.Elevation,
            TripDateTimeUtc = dto.TripDateTimeUtc,
            LocationsJson = dto.LocationsJson ?? string.Empty,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };

        _dbContext.Plans.Add(plan);

        var socialProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(x => x.UserId == plan.CreatedById)
            ?? throw new CustomException("Social profile not found for the current user.");
        socialProfile.PlanCount += 1;
        _dbContext.SocialProfiles.Update(socialProfile);

        await _dbContext.SaveChangesAsync();

        return await _dbContext.Plans
            .Where(x => x.Id == plan.Id)
            .ProjectToDto(_dbContext, _googleMapsService)
            .FirstAsync();
    }

    public async Task<PlanDto?> UpdatePlanAsync(Guid id, UpdatePlanDto dto)
    {
        if (dto is null)
        {
            throw new CustomException("UpdatePlanDto cannot be null.");
        }

        var plan = await _dbContext.Plans.FindAsync(id);
        if (plan is null)
        {
            return null;
        }

        if (dto.Title is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.Title, "Title");
            plan.Title = dto.Title;
        }

        if (dto.Description is not null)
        {
            DtoValidationHelper.ValidateRequiredString(dto.Description, "Description");
            plan.Description = dto.Description;
        }

        if (dto.Distance.HasValue)
        {
            plan.Distance = dto.Distance.Value;
        }

        if (dto.Duration.HasValue)
        {
            plan.Duration = dto.Duration.Value;
        }

        if (dto.Elevation.HasValue)
        {
            plan.Elevation = dto.Elevation.Value;
        }

        if (dto.TripDateTimeUtc.HasValue)
        {
            plan.TripDateTimeUtc = dto.TripDateTimeUtc.Value;
        }

        if (dto.LocationsJson is not null)
        {
            plan.LocationsJson = dto.LocationsJson;
        }

        plan.UpdatedAtUtc = DateTime.UtcNow;
        plan.UpdatedById = Guid.Parse(_currentUserService.UserId!);

        await _dbContext.SaveChangesAsync();

        return await _dbContext.Plans
            .Where(x => x.Id == plan.Id)
            .ProjectToDto(_dbContext, _googleMapsService)
            .FirstOrDefaultAsync();
    }

    public async Task<PlanDto?> SetPlanAttendanceAsync(Guid planId, bool confirmed)
    {
        var plan = await _dbContext.Plans.FirstOrDefaultAsync(x => x.Id == planId);
        if (plan is null)
        {
            return null;
        }

        var userId = Guid.Parse(_currentUserService.UserId!);
        var rider = await _dbContext.Set<PlanRiderEntity>()
            .FirstOrDefaultAsync(x => x.PlanId == planId && x.UserId == userId);

        if (rider is null)
        {
            _dbContext.Set<PlanRiderEntity>().Add(new PlanRiderEntity
            {
                PlanId = planId,
                UserId = userId,
                Confirmed = confirmed,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
                CreatedById = userId,
                UpdatedById = userId,
            });
        }
        else
        {
            rider.Confirmed = confirmed;
            rider.UpdatedAtUtc = DateTime.UtcNow;
            rider.UpdatedById = userId;
        }

        await _dbContext.SaveChangesAsync();
        return await GetPlanByIdAsync(planId);
    }

    public async Task<PlanDto?> RemovePlanAttendanceAsync(Guid planId)
    {
        var plan = await _dbContext.Plans.FirstOrDefaultAsync(x => x.Id == planId);
        if (plan is null)
        {
            return null;
        }

        var userId = Guid.Parse(_currentUserService.UserId!);
        var rider = await _dbContext.Set<PlanRiderEntity>()
            .FirstOrDefaultAsync(x => x.PlanId == planId && x.UserId == userId);

        if (rider is not null)
        {
            _dbContext.Set<PlanRiderEntity>().Remove(rider);
            await _dbContext.SaveChangesAsync();
        }

        return await GetPlanByIdAsync(planId);
    }

    public async Task<bool> DeletePlanAsync(Guid id)
    {
        var plan = await _dbContext.Plans.FindAsync(id);
        if (plan is null)
        {
            return false;
        }

        var socialProfile = await _dbContext.SocialProfiles.FirstOrDefaultAsync(x => x.UserId == plan.CreatedById);
        if (socialProfile is not null)
        {
            socialProfile.PlanCount = Math.Max(0, socialProfile.PlanCount - 1);
            _dbContext.SocialProfiles.Update(socialProfile);
        }

        _dbContext.Plans.Remove(plan);
        await _dbContext.SaveChangesAsync();

        return true;
    }
}
