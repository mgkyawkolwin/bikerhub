using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

public interface IChatService
{
    Task<PaginatedResultDto<ChatHeadDto>> GetChatHeadsAsync(int page, int pageSize, Guid currentUserId);
    Task<PaginatedResultDto<ChatMessageDto>> GetChatMessagesAsync(Guid friendId, Guid currentUserId);
    Task<ChatMessageDto> SendChatMessageAsync(Guid currentUserId, SendChatMessageDto dto);
    Task MarkChatMessageAsReadAsync(int messageId, Guid currentUserId);
}

public class ChatService : IChatService
{
    private readonly AppDbContext _dbContext;

    public ChatService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<ChatHeadDto>> GetChatHeadsAsync(int page, int pageSize, Guid currentUserId)
    {
        var query = _dbContext.ChatMessages
            .Where(m => m.SenderId == currentUserId || m.ReceiverId == currentUserId);

        var grouped = await query.ToListAsync();
        var heads = grouped
            .GroupBy(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
            .Select(g =>
            {
                var latest = g.OrderByDescending(m => m.SentAt).First();
                var unreadCount = g.Count(m => m.ReceiverId == currentUserId && !m.Read);
                return new ChatHeadDto(
                    latest.Id,
                    g.Key,
                    latest.SenderId == currentUserId ? latest.ReceiverName : latest.SenderName,
                    latest.SenderId == currentUserId ? latest.ReceiverProfilePictureUrl : latest.SenderProfilePictureUrl,
                    latest.TextMessage,
                    latest.SentAt,
                    unreadCount
                );
            })
            .OrderByDescending(head => head.MessageDateTimeUTC)
            .ToList();

        var total = heads.Count;
        var paged = heads.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PaginatedResultDto<ChatHeadDto>(paged, page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<PaginatedResultDto<ChatMessageDto>> GetChatMessagesAsync(Guid friendId, Guid currentUserId)
    {
        var messages = await _dbContext.ChatMessages
            .Where(m => (m.SenderId == currentUserId && m.ReceiverId == friendId) || (m.SenderId == friendId && m.ReceiverId == currentUserId))
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        var items = messages.Select(MapMessage).ToList();
        return new PaginatedResultDto<ChatMessageDto>(items, 1, items.Count, items.Count, 1);
    }

    public async Task<ChatMessageDto> SendChatMessageAsync(Guid currentUserId, SendChatMessageDto dto)
    {
        DtoValidationHelper.ValidateGuid(dto.ReceiverId, "ReceiverId");
        DtoValidationHelper.ValidateRequiredString(dto.TextMessage, "TextMessage");

        var message = new ChatMessage
        {
            SenderId = currentUserId,
            ReceiverId = dto.ReceiverId,
            TextMessage = dto.TextMessage,
            SentAt = DateTime.UtcNow,
            Sent = true,
            Delivered = true,
            Read = false
        };

        _dbContext.ChatMessages.Add(message);
        await _dbContext.SaveChangesAsync();
        return MapMessage(message);
    }

    public async Task MarkChatMessageAsReadAsync(int messageId, Guid currentUserId)
    {
        var message = await _dbContext.ChatMessages.FindAsync(messageId);
        if (message == null || message.ReceiverId != currentUserId)
        {
            return;
        }

        message.Read = true;
        _dbContext.ChatMessages.Update(message);
        await _dbContext.SaveChangesAsync();
    }

    private static ChatMessageDto MapMessage(ChatMessage message)
    {
        return new ChatMessageDto(
            message.Id,
            message.SenderId,
            message.SenderName,
            message.SenderProfilePictureUrl,
            message.ReceiverId,
            message.ReceiverName,
            message.ReceiverProfilePictureUrl,
            message.TextMessage,
            message.SentAt,
            message.Sent,
            message.Delivered,
            message.Read
        );
    }
}
