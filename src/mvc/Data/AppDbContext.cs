using Microsoft.EntityFrameworkCore;
using BikerHub.Entities;

namespace BikerHub.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<BikerHub.Entities.DirectoryEntity> Directories => Set<BikerHub.Entities.DirectoryEntity>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<BikeListing> BikeListings => Set<BikeListing>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<News> News => Set<News>();
    public DbSet<BikerHub.Entities.RouteEntity> Routes => Set<BikerHub.Entities.RouteEntity>();
    public DbSet<RideEntity> Rides => Set<RideEntity>();
    public DbSet<SocialPostEntity> Posts => Set<SocialPostEntity>();
    public DbSet<SocialProfileEntity> SocialProfiles => Set<SocialProfileEntity>();
    public DbSet<SocialPostLikeEntity> SocialPostLikes => Set<SocialPostLikeEntity>();
    public DbSet<SocialPostCommentEntity> SocialPostComments => Set<SocialPostCommentEntity>();
    public DbSet<StolenBikeReport> StolenBikeReports => Set<StolenBikeReport>();
}
