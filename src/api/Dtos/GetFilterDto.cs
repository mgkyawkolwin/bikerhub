namespace BikerHub.Dtos;

public sealed class GetDirectoriesFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; }
    public string? BusinessType { get; set; }
    public string? City { get; set; }
    public string? StateDivision { get; set; }
}
