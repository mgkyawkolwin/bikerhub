using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Extensions;

namespace BikerHub.Api.Services;

public interface IStolenBikeService
{
    Task<StolenBikeReportDto> CreateReportAsync(StolenBikeReportDto dto);
    Task<PaginatedResultDto<StolenBikeReportDto>> GetReportsAsync(StolenBikeReportFilterDto filter);
    Task<StolenBikeReportDto?> GetReportByIdAsync(Guid id);
    Task<StolenBikeReportDto> UploadReportMediaAsync(Guid reportId, IFormFile file, Guid currentUserId);
}

public class StolenBikeService : IStolenBikeService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly ILogger<StolenBikeService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public StolenBikeService(AppDbContext dbContext, IStorageService storageService, ILogger<StolenBikeService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<StolenBikeReportDto> CreateReportAsync(StolenBikeReportDto dto)
    {
        var entity = new StolenBikeReportEntity
        {
            Make = dto.Make!,
            Model = dto.Model!,
            Edition = dto.Edition,
            Year = dto.Year ?? 0,
            Cc = dto.Cc ?? 0,
            Mileage = dto.Mileage ?? 0,
            Vin = dto.Vin,
            Type = dto.Type!,
            Phone = dto.Phone,
            City = dto.City!,
            Country = dto.Country!,
            StolenDate = dto.StolenDate ?? DateTime.UtcNow,
            Description = dto.Description,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!)
        };

        _dbContext.StolenBikeReports.Add(entity);
        await _dbContext.SaveChangesAsync();

        var createdReport = await _dbContext.StolenBikeReports
            .Where(r => r.Id == entity.Id)
            .ProjectToDto(_dbContext)
            .FirstOrDefaultAsync();

        return createdReport?.ResolveMediaUrls(_storageService)
            ?? throw new CustomException("Failed to load created report.");
    }

    public async Task<PaginatedResultDto<StolenBikeReportDto>> GetReportsAsync(StolenBikeReportFilterDto filter)
    {
        if (filter.Page < 1) filter = filter with { Page = 1 };
        if (filter.PageSize < 1) filter = filter with { PageSize = 10 };

        var query = _dbContext.StolenBikeReports.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Make)) query = query.Where(x => x.Make == filter.Make);
        if (!string.IsNullOrWhiteSpace(filter.Model)) query = query.Where(x => x.Model == filter.Model);
        if (filter.Year.HasValue) query = query.Where(x => x.Year == filter.Year.Value);
        if (filter.Cc.HasValue) query = query.Where(x => x.Cc == filter.Cc.Value);
        if (!string.IsNullOrWhiteSpace(filter.Type)) query = query.Where(x => x.Type == filter.Type);
        if (!string.IsNullOrWhiteSpace(filter.City)) query = query.Where(x => x.City == filter.City);
        if (!string.IsNullOrWhiteSpace(filter.Country)) query = query.Where(x => x.Country == filter.Country);
        if (filter.StolenDate.HasValue)
        {
            var stolenDate = filter.StolenDate.Value.Date;
            query = query.Where(x => x.StolenDate >= stolenDate && x.StolenDate < stolenDate.AddDays(1));
        }

        var total = await query.CountAsync();
        var items = (await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ProjectToDto(_dbContext)
            .ToListAsync()).ResolveMediaUrls(_storageService);

        return new PaginatedResultDto<StolenBikeReportDto>(
            items,
            filter.Page,
            filter.PageSize,
            total,
            (int)Math.Max(1, Math.Ceiling(total / (double)filter.PageSize)));
    }

    public async Task<StolenBikeReportDto?> GetReportByIdAsync(Guid id)
    {
        var report = await _dbContext.StolenBikeReports
            .Where(r => r.Id == id)
            .ProjectToDto(_dbContext)
            .FirstOrDefaultAsync();

        return report?.ResolveMediaUrls(_storageService);
    }

    public async Task<StolenBikeReportDto> UploadReportMediaAsync(Guid reportId, IFormFile file, Guid currentUserId)
    {
        var report = await _dbContext.StolenBikeReports.FindAsync(reportId);
        if (report is null)
            throw new CustomException("Report not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        var media = new MediaEntity
        {
            OwnerId = report.Id,
            ObjectName = objectName,
            ContentType = file.ContentType ?? "application/octet-stream",
            Size = file.Length,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };
        _dbContext.Medias.Add(media);
        await _dbContext.SaveChangesAsync();

        var createdReport = await _dbContext.StolenBikeReports
            .Where(r => r.Id == report.Id)
            .ProjectToDto(_dbContext)
            .FirstOrDefaultAsync();

        return createdReport?.ResolveMediaUrls(_storageService)
            ?? throw new CustomException("Failed to load report after upload.");
    }
}
