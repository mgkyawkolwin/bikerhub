using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Services;

namespace BikerHub.Api.Extensions;

public static class ChatMessageMappingExtensions
{
    public static IQueryable<ChatMessageDto> ProjectToDto(
        this IQueryable<ChatMessage> baseQuery,
        AppDbContext dbContext)
    {
        return from message in baseQuery
               let sender = dbContext.Users
                   .Where(u => u.Id == message.SenderId)
                   .Select(u => new { u.DisplayName, u.UserName, u.ProfilePictureUrl })
                   .FirstOrDefault()
               let receiver = dbContext.Users
                   .Where(u => u.Id == message.ReceiverId)
                   .Select(u => new { u.DisplayName, u.UserName, u.ProfilePictureUrl })
                   .FirstOrDefault()
               select new ChatMessageDto(
                   message.Id,
                   message.SenderId,
                   sender != null ? (sender.DisplayName ?? sender.UserName) : null,
                   sender != null ? sender.ProfilePictureUrl : null,
                   message.ReceiverId,
                   receiver != null ? (receiver.DisplayName ?? receiver.UserName) : null,
                   receiver != null ? receiver.ProfilePictureUrl : null,
                   message.TextMessage,
                   message.MessageType,
                   dbContext.Medias
                       .Where(m => m.OwnerId == message.Id)
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
                   message.CreatedAtUtc,
                   message.Sent,
                   message.Delivered,
                   message.Read
               );
    }

    public static ChatMessageDto ToDto(this ChatMessage message, AppDbContext dbContext, IStorageService storageService)
    {
        var sender = dbContext.Users
            .Where(u => u.Id == message.SenderId)
            .Select(u => new { u.DisplayName, u.UserName, u.ProfilePictureUrl })
            .FirstOrDefault();

        var receiver = dbContext.Users
            .Where(u => u.Id == message.ReceiverId)
            .Select(u => new { u.DisplayName, u.UserName, u.ProfilePictureUrl })
            .FirstOrDefault();

        var medias = message.MessageType == ChatMessageType.Media
            ? dbContext.Medias
                .Where(m => m.OwnerId == message.Id)
                .Select(m => new MediaDto
                {
                    Id = m.Id,
                    OwnerId = m.OwnerId,
                    ObjectName = m.ObjectName,
                    ContentType = m.ContentType,
                    Size = m.Size,
                    Url = m.ObjectName
                })
                .ToList()
            : new List<MediaDto>();

        var dto = new ChatMessageDto(
            message.Id,
            message.SenderId,
            sender != null ? (sender.DisplayName ?? sender.UserName) : null,
            sender != null ? sender.ProfilePictureUrl : null,
            message.ReceiverId,
            receiver != null ? (receiver.DisplayName ?? receiver.UserName) : null,
            receiver != null ? receiver.ProfilePictureUrl : null,
            message.TextMessage,
            message.MessageType,
            medias,
            message.CreatedAtUtc,
            message.Sent,
            message.Delivered,
            message.Read
        );

        return dto.ResolveMediaUrls(storageService)!;
    }

    public static ChatMessageDto? ResolveMediaUrls(this ChatMessageDto? dto, IStorageService storageService)
    {
        if (dto is null || dto.Medias is null) return dto;

        foreach (var media in dto.Medias)
        {
            media.Url = storageService.BuildObjectUrl(media.ObjectName);
        }

        return dto;
    }

    public static IEnumerable<ChatMessageDto> ResolveMediaUrls(this IEnumerable<ChatMessageDto> dtos, IStorageService storageService)
    {
        foreach (var dto in dtos)
        {
            dto.ResolveMediaUrls(storageService);
        }

        return dtos;
    }
}
