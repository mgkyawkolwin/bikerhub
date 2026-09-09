namespace BikerHub.Api.Dtos;

public sealed record GarageBikeServiceHistoryDto
{
    public Guid Id { get; set; }
    public Guid GarageBikeId { get; set; }
    public string ServiceType { get; set; } = "Oil";
    public string Name { get; set; } = string.Empty;
    public DateTime ServiceDate { get; set; }
    public int Mileage { get; set; }
}
