using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public interface IChallengeService
{
    Task<IEnumerable<ChallengeDto>> GetCurrentChallengesAsync();
    Task<ChallengeDto?> GetChallengeByIdAsync(int id);
}

public class ChallengeService : IChallengeService
{
    private readonly AppDbContext _dbContext;

    public ChallengeService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<ChallengeDto>> GetCurrentChallengesAsync()
    {
        var challenges = await _dbContext.Challenges.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return challenges.Select(MapChallenge);
    }

    public async Task<ChallengeDto?> GetChallengeByIdAsync(int id)
    {
        var challenge = await _dbContext.Challenges.FindAsync(id);
        return challenge is null ? null : MapChallenge(challenge);
    }

    private static ChallengeDto MapChallenge(Challenge challenge)
    {
        var leaderboard = JsonSerializer.Deserialize<IEnumerable<ChallengeLeaderboardEntryDto>>(challenge.LeaderboardJson)
            ?? Enumerable.Empty<ChallengeLeaderboardEntryDto>();

        return new ChallengeDto(
            challenge.Id,
            challenge.Title,
            challenge.Description,
            challenge.CoverImageUrl,
            challenge.ImageUrl,
            leaderboard
        );
    }
}
