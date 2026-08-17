using System.Collections.Generic;

namespace BikerHub.Api.Dtos;

public sealed record CreatePostDto
{
     public required Guid CreatedById { get; set; }
     public string? Content { get; set; } = null;
     public string? Visibility { get; set; } = null;
}
