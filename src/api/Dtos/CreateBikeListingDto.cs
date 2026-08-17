namespace BikerHub.Api.Dtos;

public sealed record CreateBikeListingDto(
    string Make,
    string Model,
    string Edition,
    int Year,
    decimal Price,
    string Cc,
    string Type,
    string Mileage,
    string? Vin,
    string? Description,
    string? SellerPhone,
    string SellerCity,
    string SellerCountry
);
