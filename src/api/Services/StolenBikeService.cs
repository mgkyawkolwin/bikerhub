using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface IStolenBikeService
{
    Task<StolenBikeReportDto> CreateReportAsync(StolenBikeReportDto dto);
    Task<IEnumerable<StolenBikeReportDto>> GetReportsAsync();
    Task<StolenBikeReportDto?> GetReportByIdAsync(int id);
}

public class StolenBikeService : IStolenBikeService
{
    private readonly AppDbContext _dbContext;

    public StolenBikeService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StolenBikeReportDto> CreateReportAsync(StolenBikeReportDto dto)
    {
        var entity = new StolenBikeReport
        {
            Title = dto.Title ?? string.Empty,
            Make = dto.Make,
            Model = dto.Model,
            Year = dto.Year,
            Price = dto.Price,
            Cc = dto.Cc,
            Km = dto.Km,
            Vin = dto.Vin,
            Type = dto.Type,
            Description = dto.Description,
            ImagesJson = dto.Images is null ? null : JsonSerializer.Serialize(dto.Images),
            ReportedAt = dto.ReportedAt ?? DateTime.UtcNow,
            Location = dto.Location,
        };

        _dbContext.StolenBikeReports.Add(entity);
        await _dbContext.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<IEnumerable<StolenBikeReportDto>> GetReportsAsync()
    {
        var results = await _dbContext.StolenBikeReports.OrderByDescending(r => r.ReportedAt).ToListAsync();
        return results.Select(Map);
    }

    public async Task<StolenBikeReportDto?> GetReportByIdAsync(int id)
    {
        var report = await _dbContext.StolenBikeReports.FindAsync(id);
        return report is null ? null : Map(report);
    }

    private static StolenBikeReportDto Map(StolenBikeReport entity)
    {
        var images = string.IsNullOrWhiteSpace(entity.ImagesJson)
            ? Enumerable.Empty<string>()
            : JsonSerializer.Deserialize<IEnumerable<string>>(entity.ImagesJson) ?? Enumerable.Empty<string>();

        return new StolenBikeReportDto(
            entity.Id,
            entity.Title,
            entity.Make,
            entity.Model,
            entity.Year,
            entity.Price,
            entity.Cc,
            entity.Km,
            entity.Vin,
            entity.Type,
            entity.Description,
            images,
            entity.ReportedAt,
            entity.Location
        );
    }
}
