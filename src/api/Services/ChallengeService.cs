using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;
using BikerHub.Api.Models;

namespace BikerHub.Api.Services;

public enum ChallengePeriod
{
    Past,
    Current,
    Future
}

public interface IChallengeService
{
    Task<IEnumerable<ChallengeDto>> GetChallengesByPeriodAsync(ChallengePeriod period, Guid? currentUserId = null);
    Task<IEnumerable<ChallengeDto>> GetAllAsync(Guid? currentUserId = null);
    Task<ChallengeDto?> GetChallengeByIdAsync(Guid id, Guid? currentUserId = null);
    Task<ChallengeDto> CreateAsync(CreateChallengeDto dto, IFormFile? coverPhoto = null);
    Task<ChallengeDto?> UpdateAsync(Guid id, UpdateChallengeDto dto, IFormFile? coverPhoto = null);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> JoinChallengeAsync(Guid challengeId, Guid userId);
    Task<bool> LeaveChallengeAsync(Guid challengeId, Guid userId);
}

public class ChallengeService : IChallengeService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService? _storageService;
    private readonly MinioSettings? _minioSettings;
    private readonly ILogger<ChallengeService> _logger;

    public ChallengeService(AppDbContext dbContext, IStorageService? storageService, IOptions<MinioSettings>? minioOptions = null, ILogger<ChallengeService>? logger = null)
    {
        _dbContext = dbContext;
        _storageService = storageService ?? throw new ArgumentNullException(nameof(storageService));
        _minioSettings = minioOptions?.Value ?? throw new ArgumentNullException(nameof(minioOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

    public async Task<IEnumerable<ChallengeDto>> GetAllAsync(Guid? currentUserId = null)
    {
        await _dbContext.Database.EnsureCreatedAsync();
        var challenges = await _dbContext.Challenges
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        var profilePhotoUrls = await GetProfilePhotoUrlsAsync(challenges.SelectMany(challenge => challenge.Participants).Select(participant => participant.UserId));
        return challenges.Select(challenge => MapChallenge(challenge, currentUserId, profilePhotoUrls));
    }

    public async Task<ChallengeDto> CreateAsync(CreateChallengeDto dto, IFormFile? coverPhoto = null)
    {
        _logger.LogTrace("CALLED: CreateAsync()");
        _logger.LogTrace("Dto: {@Dto}", dto);
        _logger.LogTrace("CoverPhoto: {@CoverPhoto}", coverPhoto == null ? "null" : coverPhoto.FileName);
        await _dbContext.Database.EnsureCreatedAsync();

        var challenge = new Challenge
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            NoOfParticipants = dto.NoOfParticipants,
            IsStarted = dto.StartDate <= DateTime.UtcNow,
            IsEnded = dto.EndDate < DateTime.UtcNow
        };

        if (coverPhoto is not null && _storageService is not null)
        {
            _logger.LogTrace("Uploading cover photo for challenge.");
            challenge.CoverImageUrl = await _storageService.UploadFileAsync(coverPhoto);
            _logger.LogTrace("Cover photo uploaded successfully. URL: {CoverImageUrl}", challenge.CoverImageUrl);
        }
        _logger.LogTrace("Saving new challenge to the database.");
        _dbContext.Challenges.Add(challenge);
        await _dbContext.SaveChangesAsync();
        _logger.LogTrace("New challenge saved successfully with ID: {ChallengeId}", challenge.Id);
        return MapChallenge(challenge);
    }

    public async Task<ChallengeDto?> UpdateAsync(Guid id, UpdateChallengeDto dto, IFormFile? coverPhoto = null)
    {
        await _dbContext.Database.EnsureCreatedAsync();

        var challenge = await _dbContext.Challenges.FindAsync(id);
        if (challenge is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(dto.Title))
        {
            challenge.Title = dto.Title.Trim();
        }

        if (dto.Description is not null)
        {
            challenge.Description = dto.Description.Trim();
        }

        if (dto.StartDate.HasValue)
        {
            challenge.StartDate = dto.StartDate.Value;
        }

        if (dto.EndDate.HasValue)
        {
            challenge.EndDate = dto.EndDate.Value;
        }

        if (dto.NoOfParticipants.HasValue)
        {
            challenge.NoOfParticipants = dto.NoOfParticipants.Value;
        }

        challenge.IsStarted = challenge.StartDate <= DateTime.UtcNow;
        challenge.IsEnded = challenge.EndDate < DateTime.UtcNow;

        if (coverPhoto is not null && _storageService is not null)
        {
            if (!string.IsNullOrWhiteSpace(challenge.CoverImageUrl))
            {
                var oldObjectName = GetObjectNameFromUrl(challenge.CoverImageUrl);
                if (!string.IsNullOrWhiteSpace(oldObjectName))
                {
                    await _storageService.DeleteObjectAsync(oldObjectName);
                }
            }

            challenge.CoverImageUrl = await _storageService.UploadFileAsync(coverPhoto);
        }

        challenge.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return MapChallenge(challenge);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        await _dbContext.Database.EnsureCreatedAsync();

        var challenge = await _dbContext.Challenges.FindAsync(id);
        if (challenge is null)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(challenge.CoverImageUrl) && _storageService is not null)
        {
            var objectName = GetObjectNameFromUrl(challenge.CoverImageUrl);
            if (!string.IsNullOrWhiteSpace(objectName))
            {
                await _storageService.DeleteObjectAsync(objectName);
            }
        }

        _dbContext.Challenges.Remove(challenge);
        await _dbContext.SaveChangesAsync();
        return true;
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

    private static string? GetObjectNameFromUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return Path.GetFileName(uri.LocalPath);
        }

        return Path.GetFileName(url);
    }
}
