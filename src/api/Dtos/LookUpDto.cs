namespace BikerHub.Dtos;

public sealed record LookUpDto
{
    public Guid Id { get; set; }
    public required string Category { get; set; }
    public required string Code { get; set; }
    public string? Value { get; set; }
}
