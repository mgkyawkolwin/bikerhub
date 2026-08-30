using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
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
            var result = await _chatService.GetChatHeadsAsync(page, pageSize);
            _logger.LogDebug("Count: {Count}", result.Items.Count());
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));
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
            var result = await _chatService.GetChatMessagesAsync(friendId);
            _logger.LogDebug("Count: {Count}", result.Items.Count());
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(result.Items));
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
            var message = await _chatService.SendChatMessageAsync(dto);
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(message));
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

    [HttpPost("messages/media")]
    public async Task<IActionResult> SendChatMediaMessage([FromForm] SendChatMediaMessageDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: SendChatMediaMessage(receiverId={ReceiverId}, fileName={FileName})", dto.ReceiverId, dto.File?.FileName);
            var message = await _chatService.SendChatMediaMessageAsync(dto.ReceiverId, dto.File);
            _logger.LogDebug("Result: {Result}", JsonSerializer.Serialize(message));
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
    public async Task<IActionResult> MarkMessageAsRead(Guid messageId)
    {
        try
        {
            _logger.LogDebug("CALLED: MarkMessageAsRead(messageId={MessageId})", messageId);
            await _chatService.MarkChatMessageAsReadAsync(messageId);
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
