using Microsoft.AspNetCore.Http;

namespace BikerHub.Services;

public interface IStorageService
{
    Task EnsureBucketExistsAsync();
    Task<Entities.SocialPostMediaEntity> UploadPostMediaAsync(Guid postId, IFormFile file);
    Task<string> UploadFileAsync(IFormFile file);
    Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 60 * 60);
}
