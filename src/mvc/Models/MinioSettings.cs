namespace BikerHub.Models;

public sealed record MinioSettings
{
    public required string ObjectAccessUrl { get; init; }
    public required string ServerAddress { get; init; }
    public required string AccessKey { get; init; }
    public required string SecretKey { get; init; }
    public string BucketName { get; init; } = "bikerhub";
    // optional license or policy filename or other artifacts
    public string? LicenseFileName { get; init; }
}
