using Microsoft.EntityFrameworkCore;
using BikerHub.Entities;

namespace BikerHub.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<BikerHub.Entities.Directory> Directories => Set<BikerHub.Entities.Directory>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<BikeListing> BikeListings => Set<BikeListing>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<News> News => Set<News>();
    public DbSet<BikerHub.Entities.Route> Routes => Set<BikerHub.Entities.Route>();
    public DbSet<SocialPost> SocialPosts => Set<SocialPost>();
    public DbSet<SocialProfile> SocialProfiles => Set<SocialProfile>();
    public DbSet<StolenBikeReport> StolenBikeReports => Set<StolenBikeReport>();
}
