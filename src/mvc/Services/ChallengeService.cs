using Microsoft.EntityFrameworkCore;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;

namespace BikerHub.Services;

public enum ChallengePeriod
{
    Past,
    Current,
    Future
}

public interface IChallengeService
{
    Task<IEnumerable<ChallengeDto>> GetChallengesByPeriodAsync(ChallengePeriod period, Guid? currentUserId = null);
    Task<ChallengeDto?> GetChallengeByIdAsync(Guid id, Guid? currentUserId = null);
    Task<bool> JoinChallengeAsync(Guid challengeId, Guid userId);
}

public class ChallengeService : IChallengeService
{
    private readonly AppDbContext _dbContext;

    public ChallengeService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<ChallengeDto>> GetChallengesByPeriodAsync(ChallengePeriod period, Guid? currentUserId = null)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenges = await _dbContext.Challenges
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .OrderByDescending(c => c.CreatedAtUTC)
            .ToListAsync();

        var filteredChallenges = challenges.Where(challenge => MatchesPeriod(challenge, period));
        return filteredChallenges.Select(challenge => MapChallenge(challenge, currentUserId));
    }

    public async Task<ChallengeDto?> GetChallengeByIdAsync(Guid id, Guid? currentUserId = null)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenge = await _dbContext.Challenges
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        return challenge is null ? null : MapChallenge(challenge, currentUserId);
    }

    public async Task<bool> JoinChallengeAsync(Guid challengeId, Guid userId)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenge = await _dbContext.Challenges
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == challengeId);
        if (challenge is null)
        {
            return false;
        }

        var existingParticipant = await _dbContext.Set<ChallengeParticipantEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(participant => participant.ChallengeId == challengeId && participant.UserId == userId);

        if (existingParticipant is not null)
        {
            return true;
        }

        _dbContext.Set<ChallengeParticipantEntity>().Add(new ChallengeParticipantEntity
        {
            ChallengeId = challengeId,
            UserId = userId,
            DistanceInKm = 0,
        });

        challenge.NoOfParticipants = Math.Max(challenge.NoOfParticipants, challenge.Participants.Count) + 1;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static bool MatchesPeriod(Challenge challenge, ChallengePeriod period)
    {
        return period switch
        {
            ChallengePeriod.Past => challenge.IsEnded,
            ChallengePeriod.Current => challenge.IsStarted && !challenge.IsEnded,
            ChallengePeriod.Future => !challenge.IsStarted && !challenge.IsEnded,
            _ => false
        };
    }

    private static ChallengeDto MapChallenge(Challenge challenge, Guid? currentUserId = null)
    {
        var participantCount = challenge.Participants.Count > 0 ? challenge.Participants.Count : challenge.NoOfParticipants;
        var leaderboard = challenge.Participants
            .OrderByDescending(participant => participant.DistanceInKm)
            .Select((participant, index) => new ChallengeLeaderboardEntryDto(index + 1, participant.User?.DisplayName ?? "Rider", (int)Math.Round(participant.DistanceInKm)))
            .ToList();

        var isJoined = currentUserId.HasValue && challenge.Participants.Any(participant => participant.UserId == currentUserId.Value);

        return new ChallengeDto(
            challenge.Id,
            challenge.Title,
            challenge.Description,
            challenge.CoverImageUrl,
            challenge.ImageUrl,
            leaderboard,
            participantCount,
            challenge.IsStarted,
            challenge.IsEnded,
            challenge.StartDate,
            challenge.EndDate,
            isJoined,
            challenge.CreatedAtUTC,
            challenge.UpdatedAtUTC
        );
    }
}
