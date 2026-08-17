using Microsoft.AspNetCore.Http;

namespace BikerHub.Api.Services;

public interface IStorageService
{
    Task EnsureBucketExistsAsync();
    Task<Entities.SocialPostMediaEntity> UploadPostMediaAsync(Guid postId, IFormFile file);
    Task<string> UploadFileAsync(IFormFile file);
    Task DeleteObjectAsync(string objectName);
    Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 60 * 60);
    string BuildObjectUrl(string objectName);
}
