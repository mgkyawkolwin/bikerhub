using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;
using BikerHub.Api.Extensions;

namespace BikerHub.Api.Services;

public interface IChatService
{
    Task<PaginatedResultDto<ChatHeadDto>> GetChatHeadsAsync(int page, int pageSize);
    Task<PaginatedResultDto<ChatMessageDto>> GetChatMessagesAsync(Guid friendId);
    Task<ChatMessageDto> SendChatMessageAsync(SendChatMessageDto dto);
    Task<ChatMessageDto> SendChatMediaMessageAsync(Guid receiverId, IFormFile file);
    Task MarkChatMessageAsReadAsync(Guid messageId);
}

public class ChatService : IChatService
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ChatService> _logger;
    private readonly IStorageService _storageService;

    public ChatService(AppDbContext dbContext, ICurrentUserService currentUserService, ILogger<ChatService> logger, IStorageService storageService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
        _storageService = storageService;
    }

    public async Task<PaginatedResultDto<ChatHeadDto>> GetChatHeadsAsync(int page, int pageSize)
    {
        _logger.LogTrace("CALLED: GetChatHeadsAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        var currentUserId = Guid.Parse(_currentUserService.UserId!);

        var messages = await _dbContext.ChatMessages
            .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId)
            .OrderByDescending(m => m.CreatedAtUtc)
            .ProjectToDto(_dbContext)
            .ToListAsync();

        var heads = messages
            .GroupBy(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
            .Select(g =>
            {
                var latest = g.First();
                var unreadCount = g.Count(m => m.ReceiverId == currentUserId && !m.Read);
                return new ChatHeadDto(
                    latest.Id,
                    g.Key,
                    latest.SenderId == currentUserId ? latest.ReceiverName : latest.SenderName,
                    latest.SenderId == currentUserId ? latest.ReceiverProfilePictureUrl : latest.SenderProfilePictureUrl,
                    latest.TextMessage,
                    latest.Medias?.FirstOrDefault()?.ContentType,
                    latest.MessageDateTimeUtc,
                    unreadCount
                );
            })
            .OrderByDescending(head => head.MessageDateTimeUTC)
            .ToList();

        var total = heads.Count;
        var paged = heads.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PaginatedResultDto<ChatHeadDto>(paged, page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<PaginatedResultDto<ChatMessageDto>> GetChatMessagesAsync(Guid friendId)
    {
        var items = await _dbContext.ChatMessages
            .Where(m => (m.SenderId == Guid.Parse(_currentUserService.UserId!) && m.ReceiverId == friendId) || (m.SenderId == friendId && m.ReceiverId == Guid.Parse(_currentUserService.UserId!)))
            .OrderBy(m => m.CreatedAtUtc)
            .ProjectToDto(_dbContext)
            .ToListAsync();

        return new PaginatedResultDto<ChatMessageDto>(items.ResolveMediaUrls(_storageService).ToList(), 1, items.Count, items.Count, 1);
    }

    public async Task<ChatMessageDto> SendChatMessageAsync(SendChatMessageDto dto)
    {
        DtoValidationHelper.ValidateGuid(dto.ReceiverId, "ReceiverId");
        if (dto.MessageType != ChatMessageType.Text)
        {
            throw new CustomException("Invalid message type for text endpoint.");
        }

        DtoValidationHelper.ValidateRequiredString(dto.TextMessage, "TextMessage");

        var message = new ChatMessage
        {
            SenderId = Guid.Parse(_currentUserService.UserId!),
            ReceiverId = dto.ReceiverId,
            TextMessage = dto.TextMessage,
            MessageType = ChatMessageType.Text,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            Sent = true,
            Delivered = true,
            Read = false
        };

        _dbContext.ChatMessages.Add(message);
        await _dbContext.SaveChangesAsync();
        return message.ToDto(_dbContext, _storageService);
    }

    public async Task<ChatMessageDto> SendChatMediaMessageAsync(Guid receiverId, IFormFile file)
    {
        DtoValidationHelper.ValidateGuid(receiverId, "ReceiverId");
        if (file is null || file.Length == 0)
        {
            throw new CustomException("A media file is required.");
        }

        if (!file.ContentType?.StartsWith("image/") == true && !file.ContentType?.StartsWith("video/") == true)
        {
            throw new CustomException("Only image and video media are supported.");
        }

        var message = new ChatMessage
        {
            SenderId = Guid.Parse(_currentUserService.UserId!),
            ReceiverId = receiverId,
            MessageType = ChatMessageType.Media,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            Sent = true,
            Delivered = true,
            Read = false
        };

        _dbContext.ChatMessages.Add(message);
        await _dbContext.SaveChangesAsync();

        var objectName = await _storageService.UploadFileAsync(file);
        var media = new MediaEntity
        {
            OwnerId = message.Id,
            ObjectName = objectName,
            ContentType = file.ContentType ?? "application/octet-stream",
            Size = file.Length
        };

        _dbContext.Medias.Add(media);
        await _dbContext.SaveChangesAsync();

        return message.ToDto(_dbContext, _storageService);
    }

    public async Task MarkChatMessageAsReadAsync(Guid messageId)
    {
        var message = await _dbContext.ChatMessages.FindAsync(messageId);
        if (message == null || message.ReceiverId != Guid.Parse(_currentUserService.UserId!))
        {
            return;
        }

        message.Read = true;
        _dbContext.ChatMessages.Update(message);
        await _dbContext.SaveChangesAsync();
    }

}
