using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

public interface IStolenBikeService
{
    Task<StolenBikeReportDto> CreateReportAsync(StolenBikeReportDto dto);
    Task<IEnumerable<StolenBikeReportDto>> GetReportsAsync();
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
        return Map(entity);
    }

    public async Task<IEnumerable<StolenBikeReportDto>> GetReportsAsync()
    {
        var results = await _dbContext.StolenBikeReports.OrderByDescending(r => r.CreatedAtUtc).ToListAsync();
        var reportIds = results.Select(r => r.Id).ToList();
        var medias = await _dbContext.Medias.Where(m => reportIds.Contains(m.OwnerId)).ToListAsync();
        var mediaLookup = medias
            .GroupBy(m => m.OwnerId)
            .ToDictionary(g => g.Key, g => g.Select(m => _storageService.BuildObjectUrl(m.ObjectName)).ToList());

        return results.Select(report => Map(report, mediaLookup.GetValueOrDefault(report.Id)));
    }

    public async Task<StolenBikeReportDto?> GetReportByIdAsync(Guid id)
    {
        var report = await _dbContext.StolenBikeReports.FindAsync(id);
        if (report is null) return null;

        var medias = await _dbContext.Medias.Where(m => m.OwnerId == id).ToListAsync();
        var mediaUrls = medias.Select(m => _storageService.BuildObjectUrl(m.ObjectName));
        return Map(report, mediaUrls);
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

        var medias = await _dbContext.Medias.Where(m => m.OwnerId == report.Id).ToListAsync();
        var mediaUrls = medias.Select(m => _storageService.BuildObjectUrl(m.ObjectName));
        return Map(report, mediaUrls);
    }

    private StolenBikeReportDto Map(StolenBikeReportEntity entity, IEnumerable<string>? mediaUrls = null)
    {

        return new StolenBikeReportDto(
            entity.Id,
            entity.Make,
            entity.Model,
            entity.Edition,
            entity.Year,
            entity.Cc,
            entity.Mileage,
            entity.Vin,
            entity.Type,
            entity.Phone,
            entity.City,
            entity.Country,
            entity.StolenDate,
            entity.Description,
            [],
            entity.CreatedById,
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc,
            entity.UpdatedById
        );
    }
}
