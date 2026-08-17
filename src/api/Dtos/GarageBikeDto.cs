using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Dtos;

public sealed record GarageBikeDto
{
    public Guid Id { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Cc { get; set; }
    public string? Type { get; set; }
    public string? Km { get; set; }
    public string? Vin { get; set; }
    public Guid CreatedById { get; set; }

    public IList<MediaDto> Images { get; set; } = [];
}
