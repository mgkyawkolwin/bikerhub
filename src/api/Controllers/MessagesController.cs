using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using BikerHub.Services;
using BikerHub.Exceptions;
using System.Net;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(IMessageService messageService, ILogger<MessagesController> logger)
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
            var currentUserId = GetCurrentUserId();
            var result = await _messageService.GetMessagesAsync(page, pageSize, currentUserId);
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

    [HttpGet("{messageId}")]
    public async Task<IActionResult> GetMessageById(int messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: GetMessageById({MessageId})", messageId);
            var currentUserId = GetCurrentUserId();
            var message = await _messageService.GetMessageByIdAsync(messageId, currentUserId);
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
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: MarkAsRead({MessageId})", messageId);
            await _messageService.MarkMessageAsReadAsync(messageId, GetCurrentUserId());
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

    private string GetCurrentUserId()
    {
        return User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? string.Empty;
    }
}
