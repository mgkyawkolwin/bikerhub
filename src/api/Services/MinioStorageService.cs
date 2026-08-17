using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.Exceptions;
using BikerHub.Api.Models;
using BikerHub.Api.Data;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Services;

public class MinioStorageService : IStorageService
{
    private readonly Minio.IMinioClient _client;
    private readonly MinioSettings _minioSettings;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<MinioStorageService> _logger;

    public MinioStorageService(IOptions<MinioSettings> options, AppDbContext dbContext, ILogger<MinioStorageService> logger)
    {
        _minioSettings = options.Value;
        _dbContext = dbContext;
        _logger = logger;
        _logger.LogInformation("Initializing MinioStorageService with ServerAddress: {ServerAddress}, BucketName: {BucketName}", _minioSettings.ServerAddress, _minioSettings.BucketName);

        // Build Minio client using builder pattern
        _client = new Minio.MinioClient()
            .WithEndpoint(_minioSettings.ServerAddress)
            .WithCredentials(_minioSettings.AccessKey, _minioSettings.SecretKey)
            .Build();
    }

    public async Task EnsureBucketExistsAsync()
    {
        try
        {
            var beArgs = new Minio.DataModel.Args.BucketExistsArgs()
                .WithBucket(_minioSettings.BucketName);
            var found = await _client.BucketExistsAsync(beArgs).ConfigureAwait(false);
            if (!found)
            {
                var mbArgs = new Minio.DataModel.Args.MakeBucketArgs()
                    .WithBucket(_minioSettings.BucketName);
                await _client.MakeBucketAsync(mbArgs).ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring Minio bucket exists");
            throw;
        }
    }

    public async Task<SocialPostMediaEntity> UploadPostMediaAsync(Guid postId, IFormFile file)
    {
        if (file is null) throw new ArgumentNullException(nameof(file));

        await EnsureBucketExistsAsync();

        var mediaGuid = Guid.NewGuid();
        var extension = Path.GetExtension(file.FileName) ?? string.Empty;
        var objectName = mediaGuid + extension;

        using var stream = file.OpenReadStream();
        try
        {
            var putArgs = new Minio.DataModel.Args.PutObjectArgs()
                .WithBucket(_minioSettings.BucketName)
                .WithObject(objectName)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(file.ContentType);

            await _client.PutObjectAsync(putArgs).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload object {ObjectName} to Minio", objectName);
            throw;
        }

        var entity = new SocialPostMediaEntity
        {
            PostId = postId,
            MediaGuid = mediaGuid,
            ObjectName = objectName,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType ?? "application/octet-stream",
            Size = stream.Length
        };

        _dbContext.PostMedia.Add(entity);
        await _dbContext.SaveChangesAsync();

        return entity;
    }

    public async Task<string> UploadFileAsync(IFormFile file)
    {
        if (file is null)
            throw new ArgumentNullException(nameof(file));

        await EnsureBucketExistsAsync();

        var extension = Path.GetExtension(file.FileName) ?? string.Empty;
        var objectName = Guid.NewGuid() + extension;

        using var stream = file.OpenReadStream();
        try
        {
            var putArgs = new Minio.DataModel.Args.PutObjectArgs()
                .WithBucket(_minioSettings.BucketName)
                .WithObject(objectName)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(file.ContentType);

            await _client.PutObjectAsync(putArgs).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload object {ObjectName} to Minio", objectName);
            throw;
        }

        return objectName;
    }

    public async Task DeleteObjectAsync(string objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName))
        {
            throw new ArgumentNullException(nameof(objectName));
        }

        await EnsureBucketExistsAsync();

        try
        {
            var removeArgs = new Minio.DataModel.Args.RemoveObjectArgs()
                .WithBucket(_minioSettings.BucketName)
                .WithObject(objectName);

            await _client.RemoveObjectAsync(removeArgs).ConfigureAwait(false);
        }
        catch (Minio.Exceptions.ObjectNotFoundException)
        {
            _logger.LogWarning("Attempted to delete non-existent object {ObjectName}", objectName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete object {ObjectName} from Minio", objectName);
            throw;
        }
    }

    public async Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 60 * 60)
    {
        try
        {
            var presignedArgs = new Minio.DataModel.Args.PresignedGetObjectArgs()
                .WithBucket(_minioSettings.BucketName)
                .WithObject(objectName)
                .WithExpiry(expirySeconds);

            var url = await _client.PresignedGetObjectAsync(presignedArgs).ConfigureAwait(false);
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned url for {ObjectName}", objectName);
            throw;
        }
    }

    public string BuildObjectUrl(string objectName)
    {
        if (_minioSettings is null)
        {
            throw new InvalidOperationException("Minio settings are not configured.");
        }

        if (string.IsNullOrWhiteSpace(_minioSettings.ObjectAccessUrl))
        {
            return objectName;
        }

        return $"{_minioSettings.ObjectAccessUrl}/{_minioSettings.BucketName}/{objectName}";
    }
}
