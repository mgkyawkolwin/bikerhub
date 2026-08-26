using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using BikerHub.Api.Services;
using BikerHub.Api.Exceptions;
using System.Net;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : BaseController
{
    private readonly IMessageService _messageService;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(IMessageService messageService, ILogger<MessagesController> logger) : base(logger)
    {
        _messageService = messageService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetMessages(page={Page}, pageSize={PageSize})", page, pageSize);
            var result = await _messageService.GetMessagesAsync(page, pageSize);
            _logger.LogDebug("Messages list count: {Count}", result.Items.Count());
            _logger.LogDebug("Messages list returned: {Result}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnreadStatus()
    {
        try
        {
            _logger.LogDebug("CALLED: GetUnreadStatus");
            var hasUnread = await _messageService.HasUnreadMessagesAsync();
            return Ok(new { Success = true, Data = new { HasUnread = hasUnread } });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{messageId}")]
    public async Task<IActionResult> GetMessageById(Guid messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: GetMessageById({MessageId})", messageId);
            var message = await _messageService.GetMessageByIdAsync(messageId);
            _logger.LogDebug("Message returned: {Result}", JsonSerializer.Serialize(message));
            if (message is null)
            {
                return NotFound(new { Success = false, Message = "Message not found." });
            }

            return Ok(new { Success = true, Data = message });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost("{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: MarkAsRead({MessageId})", messageId);
            await _messageService.MarkMessageAsReadAsync(messageId);
            return Ok(new { Success = true });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPatch("{messageId}/unread")]
    public async Task<IActionResult> MarkAsUnread(Guid messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: MarkAsUnread({MessageId})", messageId);
            await _messageService.MarkMessageAsUnreadAsync(messageId);
            return Ok(new { Success = true });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPatch("read/all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            _logger.LogDebug("CALLED: MarkAllAsRead");
            await _messageService.MarkAllMessagesAsReadAsync();
            return Ok(new { Success = true });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
