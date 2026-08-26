namespace BikerHub.Api.Dtos;

public sealed record CreateMessageDto(
    string Title,
    string? Body
);
