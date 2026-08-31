using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Services;

namespace BikerHub.Api.Extensions;

public static class BlogMappingExtensions
{
    public static IQueryable<BlogDto> ProjectToDto(
        this IQueryable<BlogEntity> baseQuery,
        AppDbContext dbContext)
    {
        return from blog in baseQuery
               select new BlogDto
               {
                   Id = blog.Id,
                   Title = blog.Title,
                   AuthorName = blog.AuthorName,
                   Content = blog.Content,
                   CoverImageUrl = blog.CoverImageUrl,
                   PostTypeId = blog.PostTypeId,
                   PostType = dbContext.LookUps
                       .Where(lookup => lookup.Category == "BLOG_TYPE" && lookup.Id == blog.PostTypeId)
                       .Select(lookup => lookup.Value ?? lookup.Code)
                       .FirstOrDefault()!,
                   Media = dbContext.Medias
                       .Where(m => m.OwnerId == blog.Id)
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
                   CreatedAtUtc = blog.CreatedAtUtc,
                   CreatedById = blog.CreatedById,
                   UpdatedAtUtc = blog.UpdatedAtUtc,
                   UpdatedById = blog.UpdatedById
               };
    }

    public static BlogDto? ResolveMediaUrls(this BlogDto? dto, IStorageService storageService)
    {
        if (dto is null || dto.Media is null) return dto;

        if (dto.CoverImageUrl is not null)
        {
            dto.CoverImageUrl = storageService.BuildObjectUrl(dto.CoverImageUrl);
        }

        foreach (var media in dto.Media)
        {
            media.Url = storageService.BuildObjectUrl(media.ObjectName);
        }

        return dto;
    }

    public static IEnumerable<BlogDto> ResolveMediaUrls(this IEnumerable<BlogDto> dtos, IStorageService storageService)
    {
        foreach (var dto in dtos)
        {
            dto.ResolveMediaUrls(storageService);
        }

        return dtos;
    }
}
