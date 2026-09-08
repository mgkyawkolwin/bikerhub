namespace BikerHub.Api.Dtos;

public sealed record BikeListingFilterDto
{
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? ModelYear { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public string? Cc { get; set; }
    public string? Type { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? UserId { get; set; }
}
