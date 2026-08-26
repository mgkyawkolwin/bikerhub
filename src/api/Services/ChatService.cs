using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Exceptions;

namespace BikerHub.Api.Services;

public interface IChatService
{
    Task<PaginatedResultDto<ChatHeadDto>> GetChatHeadsAsync(int page, int pageSize);
    Task<PaginatedResultDto<ChatMessageDto>> GetChatMessagesAsync(Guid friendId);
    Task<ChatMessageDto> SendChatMessageAsync(SendChatMessageDto dto);
    Task MarkChatMessageAsReadAsync(int messageId);
}

public class ChatService : IChatService
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ChatService> _logger;

    public ChatService(AppDbContext dbContext, ICurrentUserService currentUserService, ILogger<ChatService> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<ChatHeadDto>> GetChatHeadsAsync(int page, int pageSize)
    {
        var query = _dbContext.ChatMessages
            .Where(m => m.SenderId == Guid.Parse(_currentUserService.UserId!) || m.ReceiverId == Guid.Parse(_currentUserService.UserId!));

        var grouped = await query.ToListAsync();
        var heads = grouped
            .GroupBy(m => m.SenderId == Guid.Parse(_currentUserService.UserId!) ? m.ReceiverId : m.SenderId)
            .Select(g =>
            {
                var latest = g.OrderByDescending(m => m.SentAt).First();
                var unreadCount = g.Count(m => m.ReceiverId == Guid.Parse(_currentUserService.UserId!) && !m.Read);
                return new ChatHeadDto(
                    latest.Id,
                    g.Key,
                    latest.SenderId == Guid.Parse(_currentUserService.UserId!) ? latest.ReceiverName : latest.SenderName,
                    latest.SenderId == Guid.Parse(_currentUserService.UserId!) ? latest.ReceiverProfilePictureUrl : latest.SenderProfilePictureUrl,
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

    public async Task<PaginatedResultDto<ChatMessageDto>> GetChatMessagesAsync(Guid friendId)
    {
        var messages = await _dbContext.ChatMessages
            .Where(m => (m.SenderId == Guid.Parse(_currentUserService.UserId!) && m.ReceiverId == friendId) || (m.SenderId == friendId && m.ReceiverId == Guid.Parse(_currentUserService.UserId!)))
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        var items = messages.Select(MapMessage).ToList();
        return new PaginatedResultDto<ChatMessageDto>(items, 1, items.Count, items.Count, 1);
    }

    public async Task<ChatMessageDto> SendChatMessageAsync(SendChatMessageDto dto)
    {
        DtoValidationHelper.ValidateGuid(dto.ReceiverId, "ReceiverId");
        DtoValidationHelper.ValidateRequiredString(dto.TextMessage, "TextMessage");

        var message = new ChatMessage
        {
            SenderId = Guid.Parse(_currentUserService.UserId!),
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

    public async Task MarkChatMessageAsReadAsync(int messageId)
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
