namespace BikerHub.Dtos;

public sealed record CreateBikeListingDto(
    string Title,
    string? Make,
    string? Model,
    int? Year,
    decimal? Price,
    string? Cc,
    string? Type,
    string? Location,
    string? Phone,
    string? ImageUrl,
    IEnumerable<string>? Images,
    string? Mileage,
    string? Km,
    string? Vin,
    string? Description
);
