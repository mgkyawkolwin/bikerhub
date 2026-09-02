namespace BikerHub.Api.Dtos;

public sealed record UpdatePlanAttendanceDto
{
    public required bool Confirmed { get; set; }
}
