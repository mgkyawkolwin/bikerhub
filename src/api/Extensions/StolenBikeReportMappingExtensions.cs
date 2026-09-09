using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Services;

namespace BikerHub.Api.Extensions;

public static class StolenBikeReportMappingExtensions
{
    public static IQueryable<StolenBikeReportDto> ProjectToDto(
        this IQueryable<StolenBikeReportEntity> baseQuery,
        AppDbContext dbContext)
    {
        return from report in baseQuery
            select new StolenBikeReportDto(
                report.Id,
                report.Make,
                report.Model,
                report.Edition,
                report.Year,
                report.Cc,
                report.Mileage,
                report.Vin,
                report.Type,
                report.Phone,
                report.City,
                report.Country,
                report.StolenDate,
                report.Description,
                dbContext.Medias
                    .Where(m => m.OwnerId == report.Id)
                    .Select(m => new MediaDto
                    {
                        Id = m.Id,
                        OwnerId = m.OwnerId,
                        ObjectName = m.ObjectName,
                        ContentType = m.ContentType,
                        Size = m.Size,
                        Url = m.ObjectName
                    })
                    .ToList(),
                report.CreatedById,
                dbContext.Users
                    .Where(u => u.Id == report.CreatedById)
                    .Select(u => u.DisplayName ?? u.UserName)
                    .FirstOrDefault(),
                report.CreatedById,
                report.CreatedAtUtc,
                report.UpdatedAtUtc,
                report.UpdatedById
            );
    }

    public static StolenBikeReportDto? ResolveMediaUrls(this StolenBikeReportDto? dto, IStorageService storageService)
    {
        if (dto is null || dto.Medias is null) return dto;

        foreach (var media in dto.Medias)
        {
            media.Url = storageService.BuildObjectUrl(media.ObjectName);
        }

        return dto;
    }

    public static IEnumerable<StolenBikeReportDto> ResolveMediaUrls(this IEnumerable<StolenBikeReportDto> dtos, IStorageService storageService)
    {
        foreach (var dto in dtos)
        {
            dto.ResolveMediaUrls(storageService);
        }

        return dtos;
    }
}
