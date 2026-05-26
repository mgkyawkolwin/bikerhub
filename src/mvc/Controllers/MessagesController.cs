using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _messageService.GetMessagesAsync(page, pageSize, currentUserId);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("{messageId}")]
    public async Task<IActionResult> GetMessageById(int messageId)
    {
        var currentUserId = GetCurrentUserId();
        var message = await _messageService.GetMessageByIdAsync(messageId, currentUserId);
        if (message is null)
        {
            return NotFound(new { Success = false, Message = "Message not found." });
        }

        return Ok(new { Success = true, Data = message });
    }

    [HttpPost("{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        await _messageService.MarkMessageAsReadAsync(messageId, GetCurrentUserId());
        return Ok(new { Success = true });
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? string.Empty;
    }
}
