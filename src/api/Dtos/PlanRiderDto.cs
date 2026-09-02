namespace BikerHub.Api.Dtos;

public sealed record PlanRiderDto
{
    public required Guid UserId { get; set; }
    public required string DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public required bool Confirmed { get; set; }
}
