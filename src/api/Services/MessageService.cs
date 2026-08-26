using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using System.Text.Json;

namespace BikerHub.Api.Services;

public interface IMessageService
{
    Task<PaginatedResultDto<MessageDto>> GetMessagesAsync(int page, int pageSize);
    Task<PaginatedResultDto<MessageDto>> GetBroadcastMessagesAsync(int page, int pageSize);
    Task<MessageDto?> GetMessageByIdAsync(Guid messageId);
    Task<MessageDto> CreateBroadcastMessageAsync(CreateMessageDto dto);
    Task<MessageDto> UpdateBroadcastMessageAsync(Guid parentMessageId, CreateMessageDto dto);
    Task DeleteBroadcastMessageAsync(Guid parentMessageId);
    Task MarkMessageAsReadAsync(Guid messageId);
    Task MarkMessageAsUnreadAsync(Guid messageId);
    Task MarkAllMessagesAsReadAsync();
    Task<bool> HasUnreadMessagesAsync();
}

public class MessageService : IMessageService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<MessageService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public MessageService(AppDbContext dbContext, ILogger<MessageService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<MessageDto>> GetMessagesAsync(int page, int pageSize)
    {
        _logger.LogTrace("CALLED: GetMessagesAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        _logger.LogTrace("Current User ID: {UserId}", _currentUserService.UserId);
        var query = _dbContext.Messages
            .Where(m => m.UserId == Guid.Parse(_currentUserService.UserId!))
            .OrderByDescending(m => m.DateTimeUTC);

        var total = await query.CountAsync();
        _logger.LogTrace("Total messages count: {Total}", total);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        _logger.LogTrace("First or Default: {Message}", JsonSerializer.Serialize(items.FirstOrDefault()));

        return new PaginatedResultDto<MessageDto>(items.Select(MapMessage).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<MessageDto?> GetMessageByIdAsync(Guid messageId)
    {
        var message = await _dbContext.Messages.FindAsync(messageId);
        if (message == null || (message.UserId != null && message.UserId != Guid.Parse(_currentUserService.UserId!)))
        {
            return null;
        }

        return MapMessage(message);
    }

    public async Task MarkMessageAsReadAsync(Guid messageId)
    {
        var message = await _dbContext.Messages.FindAsync(messageId);
        if (message == null || (message.UserId != null && message.UserId != Guid.Parse(_currentUserService.UserId!)))
        {
            return;
        }

        message.Read = true;
        _dbContext.Messages.Update(message);
        await _dbContext.SaveChangesAsync();
    }

    public async Task MarkMessageAsUnreadAsync(Guid messageId)
    {
        var message = await _dbContext.Messages.FindAsync(messageId);
        if (message == null || (message.UserId != null && message.UserId != Guid.Parse(_currentUserService.UserId!)))
        {
            return;
        }

        message.Read = false;
        _dbContext.Messages.Update(message);
        await _dbContext.SaveChangesAsync();
    }

    public async Task MarkAllMessagesAsReadAsync()
    {
        var userId = Guid.Parse(_currentUserService.UserId!);
        var unreadMessages = await _dbContext.Messages
            .Where(m => m.UserId == userId && !m.Read)
            .ToListAsync();

        if (!unreadMessages.Any())
        {
            return;
        }

        foreach (var message in unreadMessages)
        {
            message.Read = true;
        }

        _dbContext.Messages.UpdateRange(unreadMessages);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> HasUnreadMessagesAsync()
    {
        var userId = Guid.Parse(_currentUserService.UserId!);
        return await _dbContext.Messages
            .AsNoTracking()
            .AnyAsync(m => m.UserId == userId && !m.Read);
    }

    public async Task<PaginatedResultDto<MessageDto>> GetBroadcastMessagesAsync(int page, int pageSize)
    {
        var query = _dbContext.Messages
            .Where(m => m.ParentMessageId == null)
            .OrderByDescending(m => m.DateTimeUTC);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResultDto<MessageDto>(items.Select(MapMessage).ToList(), page, pageSize, total, (int)Math.Max(1, Math.Ceiling(total / (double)pageSize)));
    }

    public async Task<MessageDto> CreateBroadcastMessageAsync(CreateMessageDto dto)
    {
        var now = DateTime.UtcNow;
        var parentMessage = new Message
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Body = dto.Body,
            DateTimeUTC = now,
            Read = false,
            UserId = Guid.Parse(_currentUserService.UserId!),
            ParentMessageId = null,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            RowVersion = Guid.NewGuid()
        };

        _dbContext.Messages.Add(parentMessage);

        var userIds = await _dbContext.Users.AsNoTracking().Select(u => u.Id).ToListAsync();
        var children = userIds.Select(userId => new Message
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Body = dto.Body,
            DateTimeUTC = now,
            Read = false,
            UserId = userId,
            ParentMessageId = parentMessage.Id,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            RowVersion = Guid.NewGuid()
        });

        _dbContext.Messages.AddRange(children);
        await _dbContext.SaveChangesAsync();

        return MapMessage(parentMessage);
    }

    public async Task<MessageDto> UpdateBroadcastMessageAsync(Guid parentMessageId, CreateMessageDto dto)
    {
        var parentMessage = await _dbContext.Messages.FirstOrDefaultAsync(m => m.Id == parentMessageId && m.ParentMessageId == null);
        if (parentMessage is null)
        {
            throw new InvalidOperationException("Parent broadcast message not found.");
        }

        var now = DateTime.UtcNow;
        parentMessage.Title = dto.Title;
        parentMessage.Body = dto.Body;
        parentMessage.UpdatedAtUtc = now;
        parentMessage.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        _dbContext.Messages.Update(parentMessage);

        var children = await _dbContext.Messages.Where(m => m.ParentMessageId == parentMessageId).ToListAsync();
        foreach (var child in children)
        {
            child.Title = dto.Title;
            child.Body = dto.Body;
            child.UpdatedAtUtc = now;
            child.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        }

        _dbContext.Messages.UpdateRange(children);
        await _dbContext.SaveChangesAsync();

        return MapMessage(parentMessage);
    }

    public async Task DeleteBroadcastMessageAsync(Guid parentMessageId)
    {
        var parentMessage = await _dbContext.Messages.FirstOrDefaultAsync(m => m.Id == parentMessageId && m.ParentMessageId == null);
        if (parentMessage is null)
        {
            throw new InvalidOperationException("Parent broadcast message not found.");
        }

        var children = await _dbContext.Messages.Where(m => m.ParentMessageId == parentMessageId).ToListAsync();
        _dbContext.Messages.RemoveRange(children);
        _dbContext.Messages.Remove(parentMessage);
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
