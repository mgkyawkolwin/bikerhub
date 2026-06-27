using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.Exceptions;
using BikerHub.Models;
using BikerHub.Data;
using BikerHub.Entities;

namespace BikerHub.Services;

public class MinioStorageService : IStorageService
{
    private readonly Minio.IMinioClient _client;
    private readonly MinioSettings _settings;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<MinioStorageService> _logger;

    public MinioStorageService(IOptions<MinioSettings> options, AppDbContext dbContext, ILogger<MinioStorageService> logger)
    {
        _settings = options.Value;
        _dbContext = dbContext;
        _logger = logger;
        _logger.LogInformation("Initializing MinioStorageService with ServerAddress: {ServerAddress}, BucketName: {BucketName}", _settings.ServerAddress, _settings.BucketName);

        // Build Minio client using builder pattern
        _client = new Minio.MinioClient()
            .WithEndpoint(_settings.ServerAddress)
            .WithCredentials(_settings.AccessKey, _settings.SecretKey)
            .Build();
    }

    public async Task EnsureBucketExistsAsync()
    {
        try
        {
            var beArgs = new Minio.DataModel.Args.BucketExistsArgs()
                .WithBucket(_settings.BucketName);
            var found = await _client.BucketExistsAsync(beArgs).ConfigureAwait(false);
            if (!found)
            {
                var mbArgs = new Minio.DataModel.Args.MakeBucketArgs()
                    .WithBucket(_settings.BucketName);
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
                .WithBucket(_settings.BucketName)
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
                .WithBucket(_settings.BucketName)
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

    public async Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 60 * 60)
    {
        try
        {
            var presignedArgs = new Minio.DataModel.Args.PresignedGetObjectArgs()
                .WithBucket(_settings.BucketName)
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
}
