using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Api.Dtos;
using BikerHub.Api.Services;
using System.Net;
using BikerHub.Api.Exceptions;
using System.Text.Json;

namespace BikerHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : BaseController
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger) : base(logger)
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
            var result = await _chatService.GetChatHeadsAsync(page, pageSize, GetCurrentUserId() ?? throw new CustomException("Invalid session user."));
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
    public async Task<IActionResult> GetChatMessages([FromQuery] Guid friendId)
    {
        try
        {
            _logger.LogDebug("CALLED: GetChatMessages(friendId={FriendId})", friendId);
            var result = await _chatService.GetChatMessagesAsync(friendId, GetCurrentUserId() ?? throw new CustomException("Invalid session user."));
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
            var message = await _chatService.SendChatMessageAsync(GetCurrentUserId() ?? throw new CustomException("Invalid session user."), dto);
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
            await _chatService.MarkChatMessageAsReadAsync(messageId, GetCurrentUserId() ?? throw new CustomException("Invalid session user."));
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
