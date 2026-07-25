using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using BikerHub.Data;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Models;

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
    Task<bool> LeaveChallengeAsync(Guid challengeId, Guid userId);
}

public class ChallengeService : IChallengeService
{
    private readonly AppDbContext _dbContext;
    private readonly MinioSettings? _minioSettings;

    public ChallengeService(AppDbContext dbContext, IOptions<MinioSettings>? minioOptions = null)
    {
        _dbContext = dbContext;
        _minioSettings = minioOptions?.Value;
    }

    public async Task<IEnumerable<ChallengeDto>> GetChallengesByPeriodAsync(ChallengePeriod period, Guid? currentUserId = null)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenges = await _dbContext.Challenges
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        var filteredChallenges = challenges.Where(challenge => MatchesPeriod(challenge, period));
        return await Task.WhenAll(filteredChallenges.Select(async challenge =>
        {
            var profilePhotoUrls = await GetProfilePhotoUrlsAsync(challenge.Participants.Select(participant => participant.UserId));
            return MapChallenge(challenge, currentUserId, profilePhotoUrls);
        }))
        .ContinueWith(task => (IEnumerable<ChallengeDto>)task.Result, TaskScheduler.Default);
    }

    public async Task<ChallengeDto?> GetChallengeByIdAsync(Guid id, Guid? currentUserId = null)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenge = await _dbContext.Challenges
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (challenge is null)
        {
            return null;
        }

        var profilePhotoUrls = await GetProfilePhotoUrlsAsync(challenge.Participants.Select(participant => participant.UserId));
        return MapChallenge(challenge, currentUserId, profilePhotoUrls);
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

        challenge.NoOfParticipants = Math.Max(0, Math.Max(challenge.NoOfParticipants, challenge.Participants.Count) + 1);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> LeaveChallengeAsync(Guid challengeId, Guid userId)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenge = await _dbContext.Challenges
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == challengeId);
        if (challenge is null)
        {
            return false;
        }

        var participant = await _dbContext.Set<ChallengeParticipantEntity>()
            .FirstOrDefaultAsync(entry => entry.ChallengeId == challengeId && entry.UserId == userId);

        if (participant is null)
        {
            return true;
        }

        _dbContext.Set<ChallengeParticipantEntity>().Remove(participant);
        challenge.NoOfParticipants = Math.Max(0, Math.Max(challenge.NoOfParticipants, challenge.Participants.Count) - 1);
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

    private ChallengeDto MapChallenge(Challenge challenge, Guid? currentUserId = null, IReadOnlyDictionary<Guid, string?>? profilePhotoUrls = null)
    {
        var participantCount = challenge.Participants.Count > 0 ? challenge.Participants.Count : challenge.NoOfParticipants;
        var leaderboard = challenge.Participants
            .OrderByDescending(participant => participant.DistanceInKm)
            .ThenBy(participant => participant.CreatedAtUtc)
            .Select((participant, index) =>
            {
                var profilePhotoUrl = profilePhotoUrls?.GetValueOrDefault(participant.UserId);
                var fallbackProfilePicture = participant.User?.ProfilePictureUrl;

                return new ChallengeLeaderboardEntryDto(
                    index + 1,
                    participant.User?.DisplayName ?? "Rider",
                    BuildMediaUrl(profilePhotoUrl ?? fallbackProfilePicture),
                    participant.DistanceInKm);
            })
            .ToList();

        var isJoined = currentUserId.HasValue && challenge.Participants.Any(participant => participant.UserId == currentUserId.Value);

        return new ChallengeDto(
            challenge.Id,
            challenge.Title,
            challenge.Description,
            BuildMediaUrl(challenge.CoverImageUrl),
            BuildMediaUrl(challenge.ImageUrl),
            leaderboard,
            participantCount,
            challenge.IsStarted,
            challenge.IsEnded,
            challenge.StartDate,
            challenge.EndDate,
            isJoined,
            challenge.CreatedAtUtc,
            challenge.UpdatedAtUtc
        );
    }

    private async Task<IReadOnlyDictionary<Guid, string?>> GetProfilePhotoUrlsAsync(IEnumerable<Guid> userIds)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, string?>();
        }

        return await _dbContext.SocialProfiles
            .AsNoTracking()
            .Where(profile => distinctUserIds.Contains(profile.UserId))
            .ToDictionaryAsync(profile => profile.UserId, profile => profile.ProfilePhotoUrl);
    }

    private string? BuildMediaUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (Uri.TryCreate(value, UriKind.Absolute, out _))
        {
            return value;
        }

        if (_minioSettings is null || string.IsNullOrWhiteSpace(_minioSettings.ObjectAccessUrl))
        {
            return value;
        }

        var baseUrl = _minioSettings.ObjectAccessUrl.TrimEnd('/');
        var bucketName = _minioSettings.BucketName?.Trim('/') ?? string.Empty;
        var objectName = value.TrimStart('/');

        return string.IsNullOrWhiteSpace(bucketName)
            ? $"{baseUrl}/{objectName}"
            : $"{baseUrl}/{bucketName}/{objectName}";
    }
}
