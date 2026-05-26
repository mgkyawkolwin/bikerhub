using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet("heads")]
    public async Task<IActionResult> GetChatHeads([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _chatService.GetChatHeadsAsync(page, pageSize, currentUserId);
        return Ok(new { Success = true, Data = result });
    }

    [HttpGet("messages")]
    public async Task<IActionResult> GetChatMessages([FromQuery] string friendId)
    {
        var result = await _chatService.GetChatMessagesAsync(friendId, GetCurrentUserId());
        return Ok(new { Success = true, Data = result });
    }

    [HttpPost("messages")]
    public async Task<IActionResult> SendChatMessage(SendChatMessageDto dto)
    {
        var message = await _chatService.SendChatMessageAsync(GetCurrentUserId(), dto);
        return Ok(new { Success = true, Data = message });
    }

    [HttpPost("messages/{messageId}/read")]
    public async Task<IActionResult> MarkMessageAsRead(int messageId)
    {
        await _chatService.MarkChatMessageAsReadAsync(messageId, GetCurrentUserId());
        return Ok(new { Success = true });
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? string.Empty;
    }
}
