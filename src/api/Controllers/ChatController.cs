using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;
using System.Net;
using BikerHub.Exceptions;
using System.Text.Json;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    [HttpGet("heads")]
    public async Task<IActionResult> GetChatHeads([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetChatHeads(page={Page}, pageSize={PageSize})", page, pageSize);
            var currentUserId = GetCurrentUserId();
            var result = await _chatService.GetChatHeadsAsync(page, pageSize, currentUserId);
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

    [HttpGet("messages")]
    public async Task<IActionResult> GetChatMessages([FromQuery] string friendId)
    {
        try
        {
            _logger.LogDebug("CALLED: GetChatMessages(friendId={FriendId})", friendId);
            var result = await _chatService.GetChatMessagesAsync(friendId, GetCurrentUserId());
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

    [HttpPost("messages")]
    public async Task<IActionResult> SendChatMessage(SendChatMessageDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: SendChatMessage(dto={Dto})", JsonSerializer.Serialize(dto));
            var message = await _chatService.SendChatMessageAsync(GetCurrentUserId(), dto);
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

    [HttpPost("messages/{messageId}/read")]
    public async Task<IActionResult> MarkMessageAsRead(int messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: MarkMessageAsRead(messageId={MessageId})", messageId);
            await _chatService.MarkChatMessageAsReadAsync(messageId, GetCurrentUserId());
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
