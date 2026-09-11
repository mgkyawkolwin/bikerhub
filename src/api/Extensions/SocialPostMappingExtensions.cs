using System;
using System.Linq;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Services;
using Microsoft.AspNetCore.Http;

namespace BikerHub.Api.Extensions;

public static class SocialPostMappingExtensions
{
    public static SocialPostDto ToDto(
        this SocialPostEntity post,
        Guid currentProfileId,
        string? profilePhotoUrl = null,
        IStorageService? storageService = null,
        HttpRequest? httpRequest = null)
    {
        if (post is null) throw new ArgumentNullException(nameof(post));

        var sharePath = $"/share/posts/{post.Id}";
        var shareUrl = sharePath;

        if (httpRequest is not null)
        {
            var host = httpRequest.Host.Value;
            var baseUrl = string.IsNullOrWhiteSpace(host)
                ? string.Empty
                : $"{httpRequest.Scheme}://{host}{httpRequest.PathBase}";

            if (!string.IsNullOrWhiteSpace(baseUrl))
            {
                shareUrl = $"{baseUrl.TrimEnd('/')}{sharePath}";
            }
        }

        var socialPostDto = new SocialPostDto
        {
            Id = post.Id,
            Content = post.Content,
            ShareUrl = shareUrl,
            LoveCount = post.LoveCount,
            CommentCount = post.CommentCount,
            ShareCount = post.ShareCount,
            IsLikedByCurrentUser = post.Likes?.Any(like => like.UserId == currentProfileId) == true,
            CreatedAtUtc = post.CreatedAtUtc,
            CreatedByUserId = post.UserId,
            CreatedByDisplayName = post.User?.DisplayName ?? string.Empty,
            CreatedByUserName = post.User?.UserName ?? string.Empty,
            CreatedByUserProfilePhotoUrl = profilePhotoUrl,
        };

        if (post.Medias?.Any() == true)
        {
            socialPostDto.Medias = post.Medias.Select(m => new SocialPostMediaDto
            {
                Id = m.Id,
                MediaGuid = m.MediaGuid,
                ObjectName = m.ObjectName,
                ContentType = m.ContentType,
                Url = storageService is null ? m.ObjectName : storageService.BuildObjectUrl(m.ObjectName)
            }).ToList();
        }

        return socialPostDto;
    }
}
