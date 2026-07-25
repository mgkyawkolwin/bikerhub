using BikerHub.Dtos;

namespace BikerHub.Services;

public interface IConfigService
{
    Task<IEnumerable<string>> GetBusinessTypesAsync();
    Task<IEnumerable<string>> GetCitiesAsync();
    Task<IEnumerable<string>> GetStateDivisionsAsync();
}

public class ConfigService : IConfigService
{
    public Task<IEnumerable<string>> GetBusinessTypesAsync()
    {
        return Task.FromResult<IEnumerable<string>>(new[]
        {
            "Repair",
            "Parts",
            "Rental",
            "Tours",
            "Accessories"
        });
    }

    public Task<IEnumerable<string>> GetCitiesAsync()
    {
        return Task.FromResult<IEnumerable<string>>(new[]
        {
            "Yangon",
            "Mandalay",
            "Naypyidaw",
            "Bago",
            "Mawlamyine"
        });
    }

    public Task<IEnumerable<string>> GetStateDivisionsAsync()
    {
        return Task.FromResult<IEnumerable<string>>(new[]
        {
            "Yangon",
            "Mandalay",
            "Sagaing",
            "Shan",
            "Kachin"
        });
    }
}
