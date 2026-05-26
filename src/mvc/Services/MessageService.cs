using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface IMessageService
{
    Task<PaginatedResultDto<MessageDto>> GetMessagesAsync(int page, int pageSize, string currentUserId);
    Task<MessageDto?> GetMessageByIdAsync(int messageId, string currentUserId);
    Task MarkMessageAsReadAsync(int messageId, string currentUserId);
}

public class MessageService : IMessageService
{
    private readonly AppDbContext _dbContext;

    public MessageService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaginatedResultDto<MessageDto>> GetMessagesAsync(int page, int pageSize, string currentUserId)
    {
        var query = _dbContext.Messages
            .Where(m => m.UserId == null || m.UserId == currentUserId)
            .OrderByDescending(m => m.DateTimeUTC);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<MessageDto>(items.Select(MapMessage).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<MessageDto?> GetMessageByIdAsync(int messageId, string currentUserId)
    {
        var message = await _dbContext.Messages.FindAsync(messageId);
        if (message == null || (message.UserId != null && message.UserId != currentUserId))
        {
            return null;
        }

        return MapMessage(message);
    }

    public async Task MarkMessageAsReadAsync(int messageId, string currentUserId)
    {
        var message = await _dbContext.Messages.FindAsync(messageId);
        if (message == null || (message.UserId != null && message.UserId != currentUserId))
        {
            return;
        }

        message.Read = true;
        _dbContext.Messages.Update(message);
        await _dbContext.SaveChangesAsync();
    }

    private static MessageDto MapMessage(Message entity)
    {
        return new MessageDto(
            entity.Id,
            entity.Title,
            entity.Body,
            entity.DateTimeUTC,
            entity.Read
        );
    }
}
