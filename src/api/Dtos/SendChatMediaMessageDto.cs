using Microsoft.AspNetCore.Http;

namespace BikerHub.Api.Dtos;

public sealed record SendChatMediaMessageDto(
    Guid ReceiverId,
    IFormFile File
);
